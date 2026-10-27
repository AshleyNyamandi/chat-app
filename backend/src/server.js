import express from "express";
import cookieParser from "cookie-parser";

import { CLIENT_URL, PORT } from "./lib/env.js";
import connectDB from "./lib/db.js";
import authRouter from "./routes/auth.route.js"
import messageRouter  from "./routes/message.route.js"
import { protectRoute } from "./middleware/auth.middleware.js";
import errorMiddleware from "./middleware/error.middleware.js";
import { app, server } from "./lib/socket.js";


app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser())

app.get("/api/v1/health", (req, res) => (
    res.status(200).json({
    message: "Api working perfectly"
})))
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/messages", protectRoute, messageRouter);
app.use((req, res, next) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});
app.use(errorMiddleware);


const startServer = async() => {
    await connectDB();
    server.listen(PORT, () => {
        console.log(`Server running on PORT: ${PORT}`)
    });
};

startServer();

