import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "./env.js";

// Generate Access Token (short-lived)
export const generateAccessToken = (userId, email) => {
  return jwt.sign(
    { userId },
    ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );
};

// Generate Refresh Token (long-lived)
export const generateRefreshToken = (userId, email) => {
  return jwt.sign(
    { userId, email },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
};