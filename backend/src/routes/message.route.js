import express from "express";
import { getAllContacts, getChatPartners, getMessagesByUserId, sendMessage } from "../controllers/message.controller.js";
import { upload } from "../middleware/upload.milldeware.js";
// import { arcjectProtect } from "../middleware/arcjet.middleware.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use( protectRoute)

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", upload, sendMessage)

export default router;