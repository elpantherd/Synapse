import { useState, useRef, useEffect, FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Doc, Id } from "../convex/_generated/dataModel";

// Define a more specific type for User objects expected in the Chat component
type ChatUser = Doc<"users"> & {
  name?: string | null; // from authTables
  email?: string | null; // from authTables
};

type ChatMessage = Doc<"messages"> & {
  url?: string | null; // getUrl can return null
};

export function Chat() {
  const [selectedUser, setSelectedUser] = useState<Id<"users"> | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const loggedInUser = useQuery(api.auth.loggedInUser);
  const users: ChatUser[] = useQuery(api.users.list) ?? [];
  const messages: ChatMessage[] = useQuery(
    api.messages.list,
    selectedUser ? { otherId: selectedUser } : "skip"
  ) ?? [];
  
  const matches = useQuery(api.matches.list) ?? [];

  const sendMessage = useMutation(api.messages.send);
  const generateUploadUrl = useMutation(api.messages.generateUploadUrl);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedUser) return;
    try {
      await sendMessage({ receiverId: selectedUser, content: message, type: "text" });
      setMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const handleSendImage = async (file: File) => {
    if (!selectedUser) return;
    try {
      const uploadUrl = await generateUploadUrl();
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await response.json();
      await sendMessage({ receiverId: selectedUser, content: storageId, type: "image" });
    } catch (error) {
      toast.error("Failed to send image");
    }
  };

  const activeUsers = users.filter(u => u._id !== loggedInUser?._id);
  const matchedUsers = matches
    .map(match => {
      if (match.user1Id === loggedInUser?._id) return match.user2Id;
      if (match.user2Id === loggedInUser?._id) return match.user1Id;
      return null;
    })
    .filter(id => id !== null) as Id<"users">[];
  
  const displayUsers = activeUsers.filter(u => matchedUsers.includes(u._id));

  if (!loggedInUser) {
    return <div className="text-center p-4">Please sign in to chat.</div>;
  }

  return (
    <div className="flex h-[700px] border rounded-lg overflow-hidden shadow-lg">
      <div className="w-1/3 border-r bg-slate-50 overflow-y-auto">
        <h3 className="p-4 font-semibold text-lg border-b text-slate-700">Connections</h3>
        {displayUsers.length === 0 && <p className="p-4 text-slate-500">No active matches to chat with.</p>}
        {displayUsers.map((user) => {
          const userName = user.name || user.email || `User ${user._id.substring(0,6)}`;
          return (
            <div
              key={user._id}
              className={`p-3 cursor-pointer hover:bg-slate-200 ${
                selectedUser === user._id ? "bg-indigo-100" : ""
              }`}
              onClick={() => setSelectedUser(user._id)}
            >
              <p className="font-medium text-slate-800">{userName}</p>
              <p className="text-sm text-slate-500">{user.email ? user.email : "No email available"}</p>
            </div>
          );
        })}
      </div>
      <div className="w-2/3 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b bg-slate-50">
              <h3 className="font-semibold text-lg text-slate-700">
                Chat with {users.find(u => u._id === selectedUser)?.name || users.find(u => u._id === selectedUser)?.email || `User ${selectedUser.substring(0,6)}`}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`flex ${msg.senderId === loggedInUser._id ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-xl shadow ${
                      msg.senderId === loggedInUser._id
                        ? "bg-indigo-500 text-white"
                        : "bg-white text-slate-700"
                    }`}
                  >
                    {msg.type === "image" && msg.url ? (
                      <img src={msg.url} alt="Shared image" className="max-w-full h-auto rounded" />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  ref={imageInputRef}
                  onChange={(e) => e.target.files && e.target.files[0] && handleSendImage(e.target.files[0])}
                  className="hidden"
                />
                <button 
                  type="button" 
                  onClick={() => imageInputRef.current?.click()}
                  className="p-2 text-slate-500 hover:text-indigo-500"
                  title="Send image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                </button>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm disabled:opacity-50"
                  disabled={!message.trim()}
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-500">Select a connection to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
