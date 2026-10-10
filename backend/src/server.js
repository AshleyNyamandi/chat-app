import express from "express";
import { PORT } from "./lib/env.js";

const app = express();

app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`)
})