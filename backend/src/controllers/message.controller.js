import { getReceiverSocketId, io } from "../lib/socket.js";
import { supabase } from "../lib/supabase.js";
import Message from "../models/Message.js";
import User from "../models/User.model.js";

export const getAllContacts = async(req, res, next) => {
    try {
        const { _id: loggedInUser } = req.user;

        const contacts = await User.find({_id: {$ne: loggedInUser}}).select("-password");

        res.status(200).json({
            data: contacts
        })
    } catch (error) {
        console.error("error in the getAllContacts controller: ", error.message);
        next(error);
    }
};

export const getChatPartners = async(req, res, next) => {
    try {
      const {_id: loggedInUser} = req.user;

      const messages =  await Message.find({
        $or: [
            {senderId: loggedInUser},
            {receiverId: loggedInUser}
        ]
      })

      const chatPartnerIds = [...new Set(messages.map(
        msg =>
            msg.senderId.toString() === loggedInUser.toString() ?
            msg.receiverId.toString()
            : msg.senderId.toString()
        ))]

       const chatPartners = await User.find({_id: {$in: chatPartnerIds}}).select("-password");
       return res.status(200).json({
        data: chatPartners
       })

    } catch (error) {
        console.error("error in the getChatPartners controller: ", error.message);
        next(error);
    }
};

export const getMessagesByUserId = async(req, res, next) => {
    try {
        const {_id: loggedInUser} = req.user;
        const { id: partnerId } = req.params;

        const messages = await Message.find({
            $or: [
                {senderId: loggedInUser, receiverId: partnerId},
                {senderId:partnerId, receiverId: loggedInUser}
            ]
        }).sort({ createdAt: 1, _id: 1 });

        res.status(200).json({
            data: messages
        })
    } catch (error) {
        console.error("error in the getMessagesByUserId controller: ", error.message);
        next(error);
    }
};


export const sendMessage = async (req, res, next) => {
  try {
    const { text } = req.body;

    if (!text?.trim() && !req.file) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }

    const { _id: senderId } = req.user;
    const { id: receiverId } = req.params;

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    let publicFileUrl = null;

    if (req.file) {
      const fileExtension = req.file.originalname.split(".").pop();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `message-image-${timestamp}-${Math.random()
        .toString(36)
        .substring(2, 7)}.${fileExtension}`;
      const filePath = `message-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("nymd-interview-app")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        return res
          .status(500)
          .json({ message: "Image saving failed", error: uploadError.message });
      }

      const { data: urlData } = supabase.storage
        .from("nymd-interview-app")
        .getPublicUrl(filePath);

      publicFileUrl = urlData.publicUrl;
    }

    const message = await Message.create({
      senderId,
      receiverId,
      text: text?.trim() || "",
      image: publicFileUrl || "",
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }

    res.status(201).json({
      message: "Message sent",
      data: message,
    });
  } catch (error) {
    console.error("error in the sendMessage controller:", error.message);
    next(error);
  }
};
