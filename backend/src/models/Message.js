import { text } from "express";
import mongoose from "mongoose";


const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true,  "Sender Id is required"]
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true,  "Reciever Id is required"]
    },    
    text: {
        type: String,
        maxlength: 2000
    },
    image: String
}, {timestamps: true});

const Message = mongoose.model("Message", messageSchema);

export default Message;