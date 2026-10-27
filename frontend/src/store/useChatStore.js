import { create } from "zustand";
import api from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import toast from "react-hot-toast";

// Module-level handler reference so we can remove only OUR listener
let newMessageHandler = null;
let subscribedSocket = null;
let chatSession = 0;
let messageRequest = 0;
let contactsRequest = 0;
let partnersRequest = 0;
let temporaryMessageId = 0;

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: localStorage.getItem("isSoundEnabled") === "true",

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: (selectedUser) => {
    messageRequest++;
    set({ selectedUser, messages: [], isMessagesLoading: false });
  },
  resetChat: () => {
    chatSession++;
    messageRequest++;
    contactsRequest++;
    partnersRequest++;
    get().unsubscribeFromMessages();
    set({ allContacts: [], chats: [], messages: [], selectedUser: null,
      activeTab: "chats", isUsersLoading: false, isMessagesLoading: false });
  },

  getAllContacts: async () => {
    const request = ++contactsRequest;
    set({ isUsersLoading: true });
    try {
      const response = await api.get("/messages/contacts");
      if (request === contactsRequest) set({ allContacts: response.data.data });
    } catch (error) {
      if (request === contactsRequest) toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      if (request === contactsRequest) set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    const request = ++partnersRequest;
    set({ isUsersLoading: true });
    try {
      const response = await api.get("/messages/chats");
      if (request === partnersRequest) set({ chats: response.data.data });
    } catch (error) {
      if (request === partnersRequest) toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      if (request === partnersRequest) set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    const request = ++messageRequest;
    set({ isMessagesLoading: true });
    try {
      const response = await api.get(`/messages/${userId}`);
      if (request !== messageRequest || get().selectedUser?._id !== userId) return;
      const history = response.data.data;
      const ids = new Set(history.map(message => message._id));
      set({ messages: [...history, ...get().messages.filter(message => !ids.has(message._id))] });
    } catch (error) {
      if (request === messageRequest) toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      if (request === messageRequest) set({ isMessagesLoading: false });
    }
  },

sendMessage: async ({ text, imageFile }) => {
  const selectedUser = get().selectedUser;
  if (!selectedUser) return false;
  const session = chatSession;

  const authenticatedUser = useAuthStore.getState().authenticatedUser;
  const tempId = `temp-${Date.now()}-${++temporaryMessageId}`;

  
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
    if (session !== chatSession) return false;
    if (get().selectedUser?._id === selectedUser._id) {
      const messages = get().messages.map((m) => (m._id === tempId ? realMessage : m));
      set({ messages: [...new Map(messages.map(message => [message._id, message])).values()] });
    }
    if (!get().chats.some(user => user._id === selectedUser._id)) {
      set({ chats: [selectedUser, ...get().chats] });
    }
    return true;
  } catch (error) {
    if (session === chatSession) {
      set({ messages: get().messages.filter((m) => m._id !== tempId) });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
    return false;
  } finally {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }
},

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Remove any previous handler we registered
    get().unsubscribeFromMessages();
    subscribedSocket = socket;

    newMessageHandler = (newMessage) => {
      const selectedUser = get().selectedUser;
      if (!get().chats.some(user => user._id === newMessage.senderId)) {
        const contact = get().allContacts.find(user => user._id === newMessage.senderId);
        if (contact) set({ chats: [contact, ...get().chats] });
        else get().getMyChatPartners();
      }
      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser?._id;
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
    if (subscribedSocket && newMessageHandler) {
      subscribedSocket.off("newMessage", newMessageHandler);
    }
    subscribedSocket = null;
    newMessageHandler = null;
  },
}));
