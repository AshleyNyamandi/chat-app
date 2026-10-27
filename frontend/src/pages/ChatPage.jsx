import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from '../store/useChatStore';
import ProfileHeader from '../components/ProfileHeader';
import ActiveTabSwitch from '../components/ActiveTabSwitch';
import ChatsList from '../components/ChatsList';
import ContactList from '../components/ContactList';
import NoConversationPlaceholder from '../components/NoConversationPlaceholder';
import ChatContainer from '../components/ChatContainer';

const ChatPage = () => {

  const activeTab = useChatStore(state => state.activeTab);
  const selectedUser = useChatStore(state => state.selectedUser);
  const socket = useAuthStore(state => state.socket);
  const subscribe = useChatStore(state => state.subscribeToMessages);
  const unsubscribe = useChatStore(state => state.unsubscribeFromMessages);
  useEffect(() => {
    subscribe();
    return unsubscribe;
  }, [socket, subscribe, unsubscribe]);
  return (
    <div className="relative w-full max-w-6xl h-[calc(100dvh-2rem)] max-h-200">
      <div className='w-full h-full flex overflow-hidden'>
        {/* LEFT SIDE */}
        <div className={`${selectedUser ? "hidden md:flex" : "flex"} w-full md:w-80 shrink-0 bg-slate-800/50 backdrop-blur-sm flex-col`}>
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className={`${selectedUser ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col bg-slate-900/50 backdrop-blur-sm`}>
          {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
        </div>
      </div>
    </div>
  )
}

export default ChatPage;
