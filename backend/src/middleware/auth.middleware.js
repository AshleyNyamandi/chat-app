import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../lib/env.js";
import User from "../models/User.model.js";

export const protectRoute = async(req, res, next) => {
    try {
        const { accessToken } = req.cookies;
        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized - no token" });
        }

        const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
        const user = await User.find({email: decoded.email}).select("-password")
        req.user = user
        next();
    } catch (error) {
        console.error("error in the protectRoute middleware:", error.message)
        return res.status(401).json(
            { message: "Unauthorized - invalid token" }
        );
    }
};