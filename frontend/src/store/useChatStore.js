import { create } from "zustand";
import api from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

// Module-level handler reference so we can remove only OUR listener
let newMessageHandler = null;
let messagesRequestId = 0;

const mergeMessages = (history, current) => {
  const messagesById = new Map(history.map((message) => [message._id, message]));
  current.forEach((message) => messagesById.set(message._id, message));
  return [...messagesById.values()].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
  );
};

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => {
    messagesRequestId += 1;
    set({ selectedUser, messages: [], isMessagesLoading: false });
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const response = await api.get("/messages/contacts");
      set({ allContacts: response.data.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const response = await api.get("/messages/chats");
      set({ chats: response.data.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    const requestId = ++messagesRequestId;
    const isCurrentRequest = () =>
      requestId === messagesRequestId && get().selectedUser?._id === userId;
    set({ isMessagesLoading: true });
    try {
      const response = await api.get(`/messages/${userId}`);
      if (isCurrentRequest()) {
        set({ messages: mergeMessages(response.data.data, get().messages) });
      }
    } catch (error) {
      if (isCurrentRequest()) {
        toast.error(error.response?.data?.message || "Something went wrong");
      }
    } finally {
      if (isCurrentRequest()) set({ isMessagesLoading: false });
    }
  },

  sendMessage: async ({ text, imageFile }) => {
    const selectedUser = get().selectedUser;
    if (!selectedUser) return;

    const authenticatedUser = useAuthStore.getState().authenticatedUser;
    const tempId = `temp-${crypto.randomUUID()}`;


    const localPreview = imageFile ? URL.createObjectURL(imageFile) : null;

    const optimisticMessage = {
      _id: tempId,
      senderId: authenticatedUser._id,
      receiverId: selectedUser._id,
      text,
      image: localPreview,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };

    set({ messages: [...get().messages, optimisticMessage] });

    try {
      const formData = new FormData();
      if (text) formData.append("text", text);
      if (imageFile) formData.append("file", imageFile);

      const response = await api.post(
        `/messages/send/${selectedUser._id}`,
        formData
      );

      const realMessage = response.data.data;
      if (get().selectedUser?._id === selectedUser._id) {
        set({
          messages: mergeMessages(
            get().messages.filter((message) => message._id !== tempId),
            [realMessage]
          ),
        });
      }
      set({ chats: [selectedUser, ...get().chats.filter((chat) => chat._id !== selectedUser._id)] });
    } catch (error) {
      set({ messages: get().messages.filter((m) => m._id !== tempId) });
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      if (localPreview) URL.revokeObjectURL(localPreview);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove any previous handler we registered
    if (newMessageHandler) {
      socket.off("newMessage", newMessageHandler);
      newMessageHandler = null;
    }

    newMessageHandler = (newMessage) => {
      get().getMyChatPartners();
      const selectedUser = get().selectedUser;
      if (!selectedUser) return;

      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser._id;
      if (!isMessageSentFromSelectedUser) return;

      // Dedupe by _id
      const currentMessages = get().messages;
      if (currentMessages.some((m) => m._id === newMessage._id)) return;

      set({ messages: [...currentMessages, newMessage] });

      if (get().isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed: ", e));
      }
    };

    socket.on("newMessage", newMessageHandler);
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket && newMessageHandler) {
      socket.off("newMessage", newMessageHandler);
    }
    newMessageHandler = null;
  },
}));
