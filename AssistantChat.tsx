import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Doc } from "../convex/_generated/dataModel";

export function AssistantChat() {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const messages = useQuery(api.messages.listAssistantMessages) ?? [];
  const sendMessageToAssistant = useMutation(api.assistants.chat);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    try {
      setNewMessage(""); // Clear input immediately for better UX
      await sendMessageToAssistant({ message: newMessage });
    } catch (error) {
      console.error("Failed to send message to assistant:", error);
      toast.error("Failed to send message. Please try again.");
    }
  };

  const currentAssistant = useQuery(api.assistants.get, loggedInUser?._id ? { userId: loggedInUser._id } : "skip");

  if (loggedInUser === undefined || currentAssistant === undefined) {
    return (
      <div className="flex justify-center items-center h-[600px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (loggedInUser === null) {
     return (
      <div className="p-4 text-center">
        Please sign in to chat with your assistant.
      </div>
    );
  }

  if (currentAssistant === null) {
    return (
      <div className="p-4 text-center">
        Assistant not set up. Please set up your assistant first.
      </div>
    );
  }

  // Sort messages by creation time, newest last
  const sortedMessages = [...messages].sort((a, b) => a._creationTime - b._creationTime);

  return (
    <div className="flex flex-col h-[600px] border rounded-lg overflow-hidden shadow-lg">
      <div className="p-4 border-b bg-slate-50">
        <h3 className="font-semibold text-lg text-slate-700">{currentAssistant.name}</h3>
        <p className="text-sm text-slate-500">{currentAssistant.personality}</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-100">
        {sortedMessages.map((msg: Doc<"messages">) => {
          const isUserMsg = msg.isAssistantMessage === false || msg.isAssistantMessage === undefined;
          
          return (
            <div
              key={msg._id}
              className={`flex ${isUserMsg ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl px-4 py-2 rounded-xl shadow ${
                  isUserMsg
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-slate-700" 
                }`}
              >
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Ask your assistant..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2"
            disabled={loggedInUser === null}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm disabled:opacity-50"
            disabled={!newMessage.trim() || loggedInUser === null}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
