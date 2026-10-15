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
        next();
    }
};

export const getChatPartners = async(req, res, next) => {
    try {
      const {_id: loggedInUser} = req.user;
      
      const messages =  await Message.find({
        $or: [
            {senderId: loggedInUser},
            {recieverId: loggedInUser}
        ]
      })

      const chatPartnerIds = [...new Set(messages.map(
        msg => 
            msg.senderId === msg.loggedInUser ?
            msg.recieverId.toString()
            : msg.senderId.toString() 
        ))]

       const chatPartners = await User.find({_id: {$in: chatPartnerIds}}).select("-password"); 
       return res.status(200).json({
        data: chatPartners
       })

    } catch (error) {
        console.error("error in the getChatPartners controller: ", error.message);
        next();        
    }
};

export const getMessagesByUserId = async(req, res, next) => {
    try {
        const {_id: loggedInUser} = req.user;
        const { id: partnerId } = req.params;

        const messages = await Message.find({
            $or: [
                {senderId: loggedInUser, recieverId: partnerId},
                {senderId:partnerId, recieverId: loggedInUser}
            ]    
        })

        res.status(200).json({
            data: messages
        })
    } catch (error) {
        console.error("error in the getMessagesByUserId controller: ", error.message);
        next();        
    }
};

export const sendMessage = async(req, res, next) => {
    try {
        const { text } = req.body;

        const { _id: senderId } = req.user
        const { id: recieverId } = req.params;

        const reciever = await User.findById(recieverId);

        if (!reciever) {
            return res.status(404).json({
                message: "User not found"
            })
        }

        if (req.file) {

            const fileExtension = req.file.originalname.split(".").pop();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); 
            const fileName = `profile-pic-${timestamp}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
    
            const filePath = `message-images/${fileName}`;
    
            const {data, error: uploadError} = await supabase.storage
            .from("nymd-interview-app")
            .upload(filePath, res.file.buffer,  {
                        contentType: req.file.mimetype,
                        cacheControl: "3600",
                        upsert: false
                    });
    
    
            if (uploadError) {
                console.error(uploadError)
                return res.status(500).json({ message: "Image saving failed", error: uploadError.message });
            }
    
            // Public URL of the uploaded asset
            const { data: urlData } = supabase.storage
                .from("nymd-interview-app")
                .getPublicUrl(filePath);
    
                const publicFileUrl = urlData.publicUrl;   
            }
        
        const message = await Message.create({
            senderId,
            recieverId,
            text,
            image: publicFileUrl || ""
        })

        res.status(201).json({
            message: "Message recieved",
            data: message
        })
    } catch (error) {
        console.error("error in the sendMessage controller: ", error.message);
        next();        
    }
}