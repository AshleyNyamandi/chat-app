import React from 'react'
import { useChatStore } from '../store/useChatStore'

const ActiveTabSwitch = () => {
  const activeTab = useChatStore(state => state.activeTab);
  const setActiveTab = useChatStore(state => state.setActiveTab);
  return (
    <div className="tabs tabs-boxed bg-transparent p-2 m-2">
      <button
        onClick={() => setActiveTab("chats")}
        className={`tab rounded-xl ${
          activeTab === "chats" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"
        }`}
      >
        Chats
      </button>

      <button
        onClick={() => setActiveTab("contacts")}
        className={`tab rounded-xl ${
          activeTab === "contacts" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400"
        }`}
      >
        Contacts
      </button>
    </div>
  )
}

export default ActiveTabSwitch