import { useRef } from 'react'
import { useChatStore } from '../store/useChatStore'
import { useAuthStore } from '../store/useAuthStore';
import { LogOutIcon, Volume2Icon, VolumeOffIcon } from 'lucide-react';

const mouseClickSound = new Audio("/sounds/mouse-click.mp3");

const ProfileHeader = () => {
  const logout = useAuthStore(state => state.logout);
  const authenticatedUser = useAuthStore(state => state.authenticatedUser);
  const updateProfile = useAuthStore(state => state.updateProfile);
  const isSoundEnabled = useChatStore(state => state.isSoundEnabled);
  const toggleSound = useChatStore(state => state.toggleSound);



  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

  const formData = new FormData();
  formData.append("file", file);    
  updateProfile(formData) 
    };

  return (
    <div className="shrink-0 p-4 sm:p-6 border-b border-slate-700/50">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* AVATAR */}
          <div className="avatar online shrink-0">
            <button
              className="size-14 rounded-full overflow-hidden relative group"
              aria-label="Edit profile picture"
              onClick={() => fileInputRef.current.click()}
            >
              <img
                src={authenticatedUser.profilePic || "/avatar.png"}
                alt="User image"
                className="size-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Edit</span>
              </div>
            </button>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* USERNAME & ONLINE TEXT */}
          <div className="min-w-0">
            <h3 className="text-slate-200 font-medium text-base truncate">
              {authenticatedUser.fullName}
            </h3>

            <p className="text-slate-400 text-xs">Online</p>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex shrink-0 items-center">
          {/* LOGOUT BTN */}
          <button
            aria-label="Log out"
            className="size-11 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
            onClick={logout}
          >
            <LogOutIcon className="size-5" />
          </button>

          {/* SOUND TOGGLE BTN */}
          <button
            aria-label={isSoundEnabled ? "Mute sounds" : "Enable sounds"}
            className="size-11 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors"
            onClick={() => {
              // play click sound before toggling
              mouseClickSound.currentTime = 0; // reset to start
              mouseClickSound.play().catch((error) => console.log("Audio play failed:", error));
              toggleSound();
            }}
          >
            {isSoundEnabled ? (
              <Volume2Icon className="size-5" />
            ) : (
              <VolumeOffIcon className="size-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
