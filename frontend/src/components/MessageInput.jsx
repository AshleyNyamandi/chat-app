import { useRef, useState } from "react";
import useKeyboardSound from "../hooks/useKeyboardSound";
import { useChatStore } from "../store/useChatStore";
import toast from "react-hot-toast";
import { ImageIcon, SendIcon, XIcon } from "lucide-react";

function MessageInput() {
  const { playRandomKeyStrokeSound } = useKeyboardSound();
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef(null);

  const sendMessage = useChatStore((state) => state.sendMessage);
  const isSoundEnabled = useChatStore((state) => state.isSoundEnabled);

  const resetInputs = () => {
    setText("");
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imageFile) || isSending) return;

    if (isSoundEnabled) playRandomKeyStrokeSound();

    const payload = {
      text: text.trim(),
      imageFile,          
    };

    resetInputs();
    setIsSending(true);

    try {
      await sendMessage(payload);
    } catch {
      // store already toasts
    } finally {
      setIsSending(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // optional size guard (e.g. 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result); // preview only
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="shrink-0 p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-slate-700/50">
      {imagePreview && (
        <div className="max-w-3xl mx-auto mb-3 flex items-center">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-lg border border-slate-700"
            />
            <button
              onClick={removeImage}
              type="button"
              aria-label="Remove image"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 hover:bg-slate-700"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2 sm:gap-4">
        <input
          type="text"
          aria-label="Message"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (isSoundEnabled) playRandomKeyStrokeSound();
          }}
          className="flex-1 min-w-0 bg-slate-800/50 border border-slate-700/50 rounded-lg py-2 px-3 sm:px-4 text-base text-slate-200 placeholder:text-slate-400"
          placeholder="Type your message..."
        />

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <button
          type="button"
          aria-label="Attach image"
          onClick={() => fileInputRef.current?.click()}
          className={`shrink-0 min-h-11 px-3 sm:px-4 bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-lg transition-colors ${
            imagePreview ? "text-cyan-500" : ""
          }`}
        >
          <ImageIcon className="w-5 h-5" />
        </button>
        <button
          type="submit"
          aria-label="Send message"
          disabled={(!text.trim() && !imageFile) || isSending}
          className="shrink-0 min-h-11 bg-linear-to-r from-cyan-500 to-cyan-600 text-white rounded-lg px-3 sm:px-4 py-2 font-medium hover:from-cyan-600 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
