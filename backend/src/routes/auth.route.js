import express from "express";
import { getMe, login, logout, refreshToken, signup, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.milldeware.js";
// import { arcjectProtect } from "../middleware/arcjet.middleware.js";


const router = express.Router();
// router.use(arcjectProtect)

router.post("/sign-up", signup); 
router.post("/login", login);
router.post("/logout", logout);
router.get("/get-me", protectRoute, getMe);
router.post("/refresh-token", refreshToken)
router.patch("/update-profile", protectRoute, upload, updateProfile)

export default router   