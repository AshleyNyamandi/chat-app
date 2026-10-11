import mongoose from "mongoose";
import { MONGO_URI } from "./env.js";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI)
        console.log("Connected to the database");
    } catch (error) {
        console.error(`Could not connect to database: ${error.message}`)
        process.exit(1)
    }
};


export default connectDB;