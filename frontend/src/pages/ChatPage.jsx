import { useEffect } from 'react'
import { useChatStore } from '../store/useChatStore';
import ProfileHeader from '../components/ProfileHeader';
import ActiveTabSwitch from '../components/ActiveTabSwitch';
import ChatsList from '../components/ChatsList';
import ContactList from '../components/ContactList';
import NoConversationPlaceholder from '../components/NoConversationPlaceholder';
import ChatContainer from '../components/ChatContainer';
import { useAuthStore } from '../store/useAuthStore';

const ChatPage = () => {

  const activeTab = useChatStore(state => state.activeTab);
  const selectedUser = useChatStore(state => state.selectedUser);
  const socket = useAuthStore(state => state.socket);
  const subscribeToMessages = useChatStore(state => state.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore(state => state.unsubscribeFromMessages);

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, subscribeToMessages, unsubscribeFromMessages]);

  return (
    <div className="relative w-full max-w-6xl h-full md:max-h-200">
      <div className='w-full h-full flex overflow-hidden'>
        {/* LEFT SIDE */}
        <div className={`${selectedUser ? "hidden md:flex" : "flex"} w-full md:w-80 shrink-0 min-h-0 bg-slate-800/50 backdrop-blur-sm flex-col`}>
          <ProfileHeader />
          <ActiveTabSwitch />

          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className={`${selectedUser ? "flex" : "hidden md:flex"} flex-1 min-w-0 min-h-0 flex-col bg-slate-900/50 backdrop-blur-sm`}>
          {selectedUser ? <ChatContainer key={selectedUser._id} /> : <NoConversationPlaceholder />}
        </div>
      </div>
    </div>
  )
}

export default ChatPage;
