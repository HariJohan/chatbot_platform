import { useState, useEffect, useRef } from "react";
import API from "../api";

export default function ChatWindow({ selectedChat, projects }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);

  // ✅ Fetch messages when chat changes
  useEffect(() => {
    if (!selectedChat?.id) return;

    const fetchMessages = async () => {
      try {
        const res = await API.get(`/messages/${selectedChat.id}`);
        setMessages(res.data || []);
      } catch (err) {
        console.error("❌ Failed to fetch messages:", err);
        setMessages([
          { id: "error", sender_id: null, text: "⚠️ Could not load messages" },
        ]);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  // ✅ Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim() || !selectedChat?.id) return;

    const chatId = selectedChat.id;

    // Optimistic UI (temporary message bubble)
    const tempMessage = {
      id: Date.now(),
      sender_id: "me",
      text,
    };
    setMessages((prev) => [...prev, tempMessage]);
    setText("");

    try {
      setTyping(true);
      const res = await API.post(`/messages/${chatId}`, { text });
      setTyping(false);

      // Replace temp message with actual backend + AI responses
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempMessage.id),
        ...(res.data || []),
      ]);
    } catch (err) {
      console.error("❌ Send message failed:", err);

      // Replace temp bubble with error message
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempMessage.id),
        { id: Date.now(), sender_id: null, text: "⚠️ Failed to send message" },
      ]);
      setTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ✅ Lookup project name if chat belongs to a project
  const projectName =
    selectedChat?.projectId && projects
      ? projects.find((p) => p.id === selectedChat.projectId)?.name
      : null;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b bg-white dark:bg-gray-800 dark:text-white text-center">
        {projectName ? (
          <>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {projectName}
            </div>
            <div className="font-bold">{selectedChat?.title}</div>
          </>
        ) : (
          <div className="font-bold">{selectedChat?.title}</div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.sender_id && m.sender_id !== null
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-2 rounded-2xl max-w-lg break-words ${
                m.sender_id && m.sender_id !== null
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-200 dark:bg-gray-700 dark:text-white rounded-bl-none"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}

        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-300 dark:bg-gray-600 px-4 py-2 rounded-2xl animate-pulse">
              Typing...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white dark:bg-gray-800 flex space-x-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-lg resize-none dark:bg-gray-700 dark:text-white"
          rows="1"
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
