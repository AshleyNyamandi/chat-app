import { ArrowLeftIcon, XIcon } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";


function ChatHeader() {
  const setSelectedUser  = useChatStore(state => state.setSelectedUser);
  const selectedUser = useChatStore(state => state.selectedUser);
  const onlineUsers  = useAuthStore(state => state.onlineUsers);
  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);

    // cleanup function
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);
   if (!selectedUser) return null;  

  return (
    <div
      className="flex shrink-0 h-20 gap-3 justify-between items-center bg-slate-800/50 border-b
   border-slate-700/50 px-3 sm:px-6"
    >
      <button
        onClick={() => setSelectedUser(null)}
        aria-label="Back to chats"
        className="md:hidden shrink-0 size-11 flex items-center justify-center text-slate-400 hover:text-slate-200"
      >
        <ArrowLeftIcon className="size-5" />
      </button>
      <div className="flex flex-1 min-w-0 items-center space-x-3">
        <div className={`avatar shrink-0 ${isOnline ? "online" : "offline"}`}>
          <div className="w-12 rounded-full">
            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="text-slate-200 font-medium truncate">{selectedUser.fullName}</h3>
          <p className="text-slate-400 text-sm">{isOnline ? "Online" : "Offline"}</p>
        </div>
      </div>

      <button
        onClick={() => setSelectedUser(null)}
        aria-label="Close conversation"
        className="hidden md:flex shrink-0 size-11 items-center justify-center"
      >
        <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" />
      </button>
    </div>
  );
}
export default ChatHeader;
