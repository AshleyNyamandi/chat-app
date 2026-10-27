import { create } from "zustand";
import toast from 'react-hot-toast';
import { io } from "socket.io-client";

import api from "../lib/axios";
import { useChatStore } from "./useChatStore";

let authSession = 0;

export const useAuthStore = create((set, get) => ({
    authenticatedUser: null,
    isCheckingAuth: true, 
    isSignUp: false,
    isLoggingIn: false,
    onlineUsers: [],
    socket: null,
    checkAuth: async () => {
        try {
            const response= await api.get("/auth/get-me");
            set({authenticatedUser: response.data?.data || null});
            get().connectSocket();
        } catch (error) {
            set({authenticatedUser: null})
            if (error.response?.status !== 401) console.error("useAuthStore: ", error.message);

        } finally {
            set({isCheckingAuth: false})
        }
    },
    signUp: async(data) => {
        try {
            set({isSignUp: true});
            const response = await api.post("/auth/sign-up", data);
            set({authenticatedUser: response.data?.data || null});
            toast.success("Account created successfully");
            get().connectSocket();
        } catch (error) {
            toast.error(error.response?.data?.message || "Error signing up");
        } finally {
            set({isSignUp: false});
        }
    },
    login: async (data) => {
        try {
            set({isLoggingIn: true});
            const response = await api.post("/auth/login", data);
            set({authenticatedUser: response.data.data})
            toast.success(response.data?.message)
            get().connectSocket()
        } catch (error) {
            toast.error(error.response?.data?.message|| "Error logging In")
        } finally {
            set({isLoggingIn:false})
        }
    },
  logout: async () => {
    try {
      await api.post("/auth/logout");
      authSession++;
      useChatStore.getState().resetChat();
      set({ authenticatedUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Error logging out");
      console.log("Logout error:", error.response?.data?.message || "Error logging out");
    }
  },  
  updateProfile: async (data) => {
    const session = authSession;
    const userId = get().authenticatedUser?._id;
    try {
      const response = await api.patch("/auth/update-profile", data);
      if (session !== authSession || get().authenticatedUser?._id !== userId) return;
      set({ authenticatedUser: response.data?.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      if (session !== authSession || get().authenticatedUser?._id !== userId) return;
      console.log("Error in update profile:", error.response?.data?.message || "Error updating profile");
      toast.error(error.response?.data?.message || "Error updating profile");
    }
  },   
  connectSocket:  () => {
    const authenticatedUser = get().authenticatedUser;
    if (!authenticatedUser || get().socket) return;

    const socket = io(import.meta.env.VITE_BASE_URL || undefined, {withCredentials: true});
    set({socket})
  
    // listen for online users
    socket.on("getOnlineUsers", (userIds) => {
        set({onlineUsers: userIds})
    })
  },
  disconnectSocket: () => {
    get().socket?.disconnect();
    set({ socket: null, onlineUsers: [] });
  }
}))
