import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "../lib/env.js";
import User from "../models/User.model.js";


export const protectRoute = async (req, res, next) => {
    try {
        let token;
        // Check HTTP-only cookie first, fallback to Authorization Bearer header
        if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        } else if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            const error = new Error("Authentication required. No access token provided.");
            error.statusCode = 401;
            throw error;
        }

        // Verify token
        const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

        // Retrieve user and exclude password field
        const currentUser = await User.findById(decoded.userId).select("-password");

        if (!currentUser) {
            const error = new Error("User belonging to this token no longer exists.");
            error.statusCode = 401;
            throw error;
        }

        // Attach user data to request object for downstream controllers
        req.user = currentUser;

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            error.message = "Invalid access token.";
            error.statusCode = 401;
        } else if (error.name === "TokenExpiredError") {
            error.message = "Access token has expired. Please refresh your token.";
            error.statusCode = 401;
        }
        next(error);
    }
};

export const restrictTo = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is populated by the protect middleware
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      const error = new Error("You do not have permission to perform this action.");
      error.statusCode = 403; // 403 Forbidden is used for role authorization failures
      return next(error);
    }
    next();
  };
};
