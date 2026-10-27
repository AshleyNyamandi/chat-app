import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken"

import User from '../models/User.model.js';
import { generateAccessToken, generateRefreshToken } from '../lib/utlls.js';
import { sendWelcomeEmail } from '../emails/emailHandles.js';
import { CLIENT_URL, NODE_ENV, REFRESH_TOKEN_SECRET } from '../lib/env.js';
import { supabase } from '../lib/supabase.js';


export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body || {};

    if (typeof fullName !== "string" || !fullName.trim() ||
        typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        typeof password !== "string" || password.length < 6) {
      return res.status(400).json({ message: "Provide a name, valid email, and password of at least 6 characters" });
    }

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: 'All fields are required',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists',
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create the new user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
    // Generate tokens
    const accessToken = generateAccessToken(newUser._id, newUser.email);
    const refreshToken = generateRefreshToken(newUser._id, newUser.email);

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    try {
      await sendWelcomeEmail(newUser.email, newUser.fullName, CLIENT_URL)
    } catch (error) {
      console.error("Error sending welcome email:", error.message)
    }

    // Remove password from response
    const userResponse = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
      createdAt: newUser.createdAt,
    };

    return res.status(201).json({
      message: 'User registered successfully',
      data: userResponse, 
    });
    }

  } catch (error) {
    console.error("Error in the signup controller: ", error.message)
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: 'Invalid email or password',
      });
    }

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: 'Invalid email or password',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id, user.email);
    const refreshToken = generateRefreshToken(user._id, user.email);

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      createdAt: user.createdAt,
    };

    return res.status(200).json({
      message: 'Logged in successfully',
      data: userResponse,
    });
  } catch (error) {
    console.error("error in the login controller: ", error.message)
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    // Clear both cookies
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
    });

    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error("Error in the logout controller: ", error.message)
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {  
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Profile image is required" });
    }
    const userId = req.user._id;  
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

        const fileExtension = req.file?.originalname.split(".").pop();

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); 
        const fileName = `profile-pic-${timestamp}-${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;

        const filePath = `profile-pics/${fileName}`

        const { data, error: uploadError } = await supabase.storage
        .from("online-school-documents")
        .upload(filePath, req.file?.buffer,  {
                    contentType: req.file.mimetype,
                    cacheControl: "3600",
                    upsert: false
                });


        if (uploadError) {
            console.log(uploadError)
            return res.status(500).json({ message: "Avatar upload failed", error: uploadError.message });
        }

        // Public URL of the uploaded asset
        const { data: urlData } = supabase.storage
            .from("online-school-documents")
            .getPublicUrl(filePath);

        const publicFileUrl = urlData.publicUrl;            
    
    user.profilePic = publicFileUrl;
    await user.save();

    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return res.status(200).json({
      message: "Profile picture successfully updated",
      data: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async(req, res, next) => {
    try {
        return res.status(200).json({
            data: req.user
        })
    } catch (error) {
        console.error("Error in the getMe controller: ", error.message)
        next(error)
    }
} 

export const refreshToken = async(req, res, next) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        
        if (!refreshToken) {
            const error = new Error("No refresh token provided");
            error.statusCode = 401;
            throw error;
        }

        // Verify refresh token
        const decoded = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        
        // Check if user exists in database
        const user = await User.findOne({   
            _id: decoded.userId, 
        });

        if (!user) {
            const error = new Error("Invalid refresh token");
            error.statusCode = 403;
            throw error;
        }

    // Generate tokens
        const newAccessToken = generateAccessToken(user._id, user.email);
        const newRefreshToken = generateRefreshToken(user._id, user.email);

        // Set new access token cookie
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: NODE_ENV === 'production',
            sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            sameSite: NODE_ENV === 'production' ? 'none' : 'lax',
            secure: NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            message: "Token refreshed successfully"
        });

    } catch (error) {
        console.error("Error in the refreshToken controller: ", error.message);
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        next(error);
    }
};
