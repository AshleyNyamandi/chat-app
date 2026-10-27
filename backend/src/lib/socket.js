import { Server } from "socket.io";
import cors from "cors";
import express from "express";
import http from "http";
import { CLIENT_URL } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socketAuth.middleware.js";

const app = express();
app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        credentials: true 
    }
});

io.use(socketAuthMiddleware);


// checking online status
export function getReceiverSocketId(userId) {
  return userSocketMap[userId]?.values().next().value;
}

// for storig online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  socket.join(userId);
  if (!userSocketMap[userId]) userSocketMap[userId] = new Set();
  userSocketMap[userId].add(socket.id);

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // with socket.on we listen for events from clients
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    userSocketMap[userId]?.delete(socket.id);
    if (userSocketMap[userId]?.size === 0) delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
