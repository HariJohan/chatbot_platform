import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { useState } from "react";

export default function Dashboard() {
  const [selectedChat, setSelectedChat] = useState({
    id: "direct",
    title: "Direct Chat",
    projectId: null,
  });
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        {/* Sidebar */}
        <Sidebar
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />

        {/* Chat Window */}
        <div className="flex-1">
          <ChatWindow selectedChat={selectedChat} />
        </div>
      </div>
    </div>
  );
}
