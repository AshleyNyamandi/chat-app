import { useEffect } from 'react'
import { useChatStore } from '../store/useChatStore';
import UsersLoadingSkeleton from './UsersLoadingSkeleton';
import { useAuthStore } from '../store/useAuthStore';

const ContactList = () => {
  const  getAllContacts = useChatStore(state => state.getAllContacts);
  const allContacts = useChatStore(state => state.allContacts);
  const setSelectedUser = useChatStore(state => state.setSelectedUser);
  const isUsersLoading = useChatStore(state => state.isUsersLoading);
  const  onlineUsers  = useAuthStore(state => state.onlineUsers);

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;  
  return (
    <>
      {allContacts.map((contact) => (
        <button
          type="button"
          key={contact._id}
          className="w-full text-left bg-cyan-500/10 p-4 rounded-lg cursor-pointer hover:bg-cyan-500/20 transition-colors"
          onClick={() => setSelectedUser(contact)}
        >
          <div className="flex items-center gap-3">
            <div className={`avatar shrink-0 ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
              <div className="size-12 rounded-full">
                <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} />
              </div>
            </div>
            <h4 className="text-slate-200 font-medium truncate">{contact.fullName}</h4>
          </div>
        </button>
      ))}
    </>
  )
}

export default ContactList
