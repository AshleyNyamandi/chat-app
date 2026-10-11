import express from "express";
import { PORT } from "./lib/env.js";
import connectDB from "./lib/db.js";
import authRouter from "./routes/auth.route.js"

const app = express();



app.use(express.json);
app.use("/api/v1/auth", authRouter)


const startServer = async() => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server running on PORT: ${PORT}`)
    });
};

startServer();

