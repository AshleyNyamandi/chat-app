import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, mock, test } from "node:test";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import express from "express";
import jwt from "jsonwebtoken";
import { io as createClient } from "socket.io-client";

// Synthetic configuration: these tests never contact a database or provider.
process.env.ACCESS_TOKEN_SECRET = "realtime-test-access-secret";
process.env.REFRESH_TOKEN_SECRET = "realtime-test-refresh-secret";
process.env.SUPABASE_URL = "http://127.0.0.1:1";
process.env.SUPABASE_SERVICE_ROLE = "realtime-test-storage-key";
process.env.RESEND_API_KEY = "re_test_unused";
process.env.NODE_ENV = "test";

const { app, server, io } = await import("../src/lib/socket.js");
const { default: User } = await import("../src/models/User.model.js");
const { default: Message } = await import("../src/models/Message.js");
const { default: authRouter } = await import("../src/routes/auth.route.js");
const { default: messageRouter } = await import("../src/routes/message.route.js");
const { default: errorMiddleware } = await import("../src/middleware/error.middleware.js");

let baseURL;
let receiverCookie;
let senderCookie;
const clients = [];
const savedMessages = [];
const senderId = "000000000000000000000001";
const receiverId = "000000000000000000000002";

async function login(email) {
  const response = await fetch(`${baseURL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "test-password" }),
  });
  assert.equal(response.status, 200);
  return response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]).join("; ");
}

function connect(cookie, transports = ["polling", "websocket"]) {
  const client = createClient(baseURL, {
    extraHeaders: cookie ? { Cookie: cookie } : {},
    transports,
    reconnection: false,
    timeout: 2000,
  });
  clients.push(client);
  return client;
}

before(async () => {
  const password = await bcrypt.hash("test-password", 4);
  const users = [
    { _id: senderId, email: "sender@example.test", fullName: "Sender", password },
    { _id: receiverId, email: "receiver@example.test", fullName: "Receiver", password },
  ];
  mock.method(User, "findOne", async ({ email }) => users.find((user) => user.email === email));
  mock.method(User, "findById", (id) => {
    const user = users.find((user) => user._id === String(id));
    return Object.assign(Promise.resolve(user), { select: async () => user });
  });
  mock.method(Message, "create", async (data) => {
    // Use the real schema to validate and serialize the message payload.
    const message = new Message(data);
    await message.validate();
    message.createdAt = new Date();
    savedMessages.push(message);
    return message;
  });
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/messages", messageRouter);
  app.use(errorMiddleware);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  baseURL = `http://127.0.0.1:${server.address().port}`;
  senderCookie = await login("sender@example.test");
  receiverCookie = await login("receiver@example.test");
});

after(async () => {
  clients.forEach((client) => client.disconnect());
  await new Promise((resolve) => io.close(resolve));
  mock.restoreAll();
});

test("login cookies authenticate sockets over polling and WebSocket", { timeout: 5000 }, async () => {
  for (const transports of [["polling"], ["websocket"]]) {
    const client = connect(receiverCookie, transports);
    await once(client, "connect");
    client.disconnect();
  }
});

test("missing, legacy, invalid and expired cookies cannot authenticate sockets", { timeout: 5000 }, async () => {
  const expiredToken = jwt.sign({ userId: receiverId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: -1 });
  for (const cookie of [undefined, "jwt=legacy-token", "accessToken=invalid", `accessToken=${expiredToken}`]) {
    const client = connect(cookie);
    const [error] = await once(client, "connect_error");
    assert.match(error.message, /Unauthorized/);
    assert.equal(client.connected, false);
    client.disconnect();
  }
});

test("sending a message returns 201 and delivers it immediately to the recipient", { timeout: 5000 }, async () => {
  // Cookie separators need not contain a space.
  const receiver = connect(receiverCookie.replaceAll("; ", ";"));
  await once(receiver, "connect");
  const incoming = once(receiver, "newMessage");
  const body = new FormData();
  body.append("text", "  Delivered without a refresh  ");
  const response = await fetch(`${baseURL}/api/v1/messages/send/${receiverId}`, {
    method: "POST",
    headers: { Cookie: senderCookie },
    body,
  });
  assert.equal(response.status, 201);
  const { data } = await response.json();
  const [message] = await incoming;
  assert.deepEqual(message, data);
  assert.equal(message.text, "Delivered without a refresh");
  assert.equal(message.senderId, senderId);
  assert.equal(message.receiverId, receiverId);
  assert.equal(savedMessages.at(-1)._id.toString(), message._id);
  receiver.disconnect();
});

test("messages to an offline recipient still return 201 and are saved", { timeout: 5000 }, async () => {
  const body = new FormData();
  body.append("text", "Read this later");
  const response = await fetch(`${baseURL}/api/v1/messages/send/${senderId}`, {
    method: "POST",
    headers: { Cookie: receiverCookie },
    body,
  });
  assert.equal(response.status, 201);
  const { data } = await response.json();
  assert.equal(data.text, "Read this later");
  assert.equal(savedMessages.at(-1)._id.toString(), data._id);
});
