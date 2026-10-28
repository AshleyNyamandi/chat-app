import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, before, test } from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import WebSocket from "ws";

if (!process.env.TEST_MONGO_URI) {
  throw new Error("Set TEST_MONGO_URI to a local MongoDB URI to run integration tests.");
}

// Only synthetic credentials are used. Text-message tests never call Supabase.
process.env.ACCESS_TOKEN_SECRET = randomUUID();
process.env.SUPABASE_URL = "http://127.0.0.1:1";
process.env.SUPABASE_SERVICE_ROLE = "local-test-only";
const { app, server, io } = await import("../src/lib/socket.js");
const { default: messageRouter } = await import("../src/routes/message.route.js");
const { default: errorMiddleware } = await import("../src/middleware/error.middleware.js");
const { default: User } = await import("../src/models/User.model.js");
const { default: Message } = await import("../src/models/Message.js");
let baseURL;
let users;
const sockets = [];

before(async () => {
  // A fresh database isolates tests from existing application data.
  await mongoose.connect(process.env.TEST_MONGO_URI, {
    dbName: `chat_test_${randomUUID().replaceAll("-", "")}`,
  });
  users = await User.create(["Alice", "Bob", "Carol"].map((fullName) => ({
    fullName, email: `${fullName.toLowerCase()}@example.test`, password: "test-only-password",
  })));
  app.use(express.json());
  app.use(cookieParser());
  app.use("/messages", messageRouter);
  app.use(errorMiddleware);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  baseURL = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  sockets.forEach((socket) => socket.terminate());
  await new Promise((resolve) => io.close(resolve));
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

const cookieFor = (user) => `accessToken=${jwt.sign(
  { userId: user._id.toString() }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "5m" }
)}`;

async function request(user, path, text) {
  const response = await fetch(`${baseURL}/messages${path}`, {
    method: text === undefined ? "GET" : "POST",
    headers: { Cookie: cookieFor(user), "Content-Type": "application/json" },
    ...(text === undefined ? {} : { body: JSON.stringify({ text }) }),
  });
  return { status: response.status, ...(await response.json()) };
}

// Speak the Socket.IO protocol over its real WebSocket transport.
function connectSocket(cookie) {
  const socket = new WebSocket(`${baseURL.replace("http", "ws")}/socket.io/?EIO=4&transport=websocket`, {
    headers: { Cookie: cookie },
  });
  sockets.push(socket);
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Socket authentication timed out")), 5000);
    socket.on("error", reject);
    socket.on("message", (data) => {
      const packet = data.toString();
      if (packet.startsWith("0")) socket.send("40");
      if (packet === "2") socket.send("3");
      if (packet.startsWith("40")) { clearTimeout(timer); resolve(socket); }
      if (packet.startsWith("44")) { clearTimeout(timer); reject(new Error(JSON.parse(packet.slice(2)).message)); }
    });
  });
}

test("chat history, chat partners and live delivery", async (t) => {
  const [alice, bob, carol] = users;
  await t.test("a sent message is saved and appears for both users after reopening", async () => {
    const sent = await request(alice, `/send/${bob._id}`, "Hello Bob");
    assert.equal(sent.status, 201);
    assert.equal(sent.data.receiverId, bob._id.toString());
    for (const [viewer, partner] of [[alice, bob], [bob, alice]]) {
      const history = await request(viewer, `/${partner._id}`);
      assert.equal(history.status, 200);
      assert.deepEqual(history.data.map((message) => message._id), [sent.data._id]);
      const chats = await request(viewer, "/chats");
      assert.deepEqual(chats.data.map((user) => user._id), [partner._id.toString()]);
      assert.equal(chats.data[0].password, undefined);
    }
  });

  await t.test("history is chronological and excludes other conversations", async () => {
    const earlier = await Message.create({ senderId: bob._id, receiverId: alice._id, text: "Earlier", createdAt: new Date("2020-01-01") });
    await request(alice, `/send/${carol._id}`, "Private for Carol");
    const history = await request(alice, `/${bob._id}`);
    assert.deepEqual(history.data.map((message) => message.text), [earlier.text, "Hello Bob"]);
    assert.deepEqual((await request(carol, `/${bob._id}`)).data, []);
    const chats = await request(alice, "/chats");
    assert.deepEqual(chats.data.map((user) => user._id).sort(), [bob._id.toString(), carol._id.toString()].sort());
  });

  await t.test("the login cookie authenticates sockets and online sending returns the saved message", async () => {
    const socket = await connectSocket(`other=value;${cookieFor(bob)}`);
    const delivered = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Message was not delivered")), 5000);
      socket.on("message", (data) => {
        const packet = data.toString();
        if (packet.startsWith("42")) {
          const [event, message] = JSON.parse(packet.slice(2));
          if (event === "newMessage") { clearTimeout(timer); resolve(message); }
        }
      });
    });
    const sent = await request(alice, `/send/${bob._id}`, "Live hello");
    assert.equal(sent.status, 201);
    assert.deepEqual(await delivered, sent.data);
    assert.equal(await Message.countDocuments({ _id: sent.data._id }), 1);
  });

  await t.test("sockets still reject unauthenticated connections", async () => {
    await assert.rejects(connectSocket("unrelated=value"), /Unauthorized/);
  });
});
