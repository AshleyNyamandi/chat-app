import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../lib/env.js";

export const protectRoute = (req, res, next) => {
    try {
        const { accessToken } = req.cookies;
        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized - no token" });
        }

        const decoded = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
        req.userId = decoded.userId;
        req.email = decoded.email
        next();
    } catch (error) {
        console.error("error in the protectRoute middleware:", error.message)
        return res.status(401).json(
            { message: "Unauthorized - invalid token" }
        );
    }
};