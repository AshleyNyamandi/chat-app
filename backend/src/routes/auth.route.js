import express from "express";
import { login, logout, signup, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.milldeware.js";


const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("logout", logout);
router.patch("/update-profile", protectRoute, upload, updateProfile)

export default router   