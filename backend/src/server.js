import express from "express";
import cookieParser from "cookie-parser";

import { CLIENT_URL, PORT } from "./lib/env.js";
import connectDB from "./lib/db.js";
import authRouter from "./routes/auth.route.js"
import messageRouter  from "./routes/message.route.js"
import { protectRoute } from "./middleware/auth.middleware.js";

const app = express();


app.use(cors({
    origin: CLIENT_URL,
    credentials: true    
}));

app.use(express.urlencoded({ extended: false }));
app.use(express.json);
app.use(cookieParser())

app.use("/api/v1/auth", authRouter);
app.use("api/v1/message", protectRoute,messageRouter)


const startServer = async() => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on PORT: ${PORT}`)
    });
};

startServer();

