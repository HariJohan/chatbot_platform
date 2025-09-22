import { useState, useEffect } from "react";
import API from "../api";

export default function Sidebar({ selectedChat, setSelectedChat }) {
  const [projects, setProjects] = useState([]);
  const [chats, setChats] = useState({});

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await API.get("/projects");
        setProjects(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjects();
  }, []);

  const fetchChats = async (projectId) => {
    try {
      const res = await API.get(`/chats/${projectId}`);
      setChats((prev) => ({ ...prev, [projectId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  };

  const addProject = async () => {
    const name = prompt("Project name?");
    if (!name) return;
    try {
      // 1. Create project
      const res = await API.post("/projects", { name });
      const newProject = res.data;
      setProjects([...projects, newProject]);

      // 2. Auto-create first chat as "Chat 1"
      const chatRes = await API.post(`/chats/${newProject.id}`, { title: "Chat 1" });
      const newChat = chatRes.data;

      setChats((prev) => ({
        ...prev,
        [newProject.id]: [newChat],
      }));

      // 3. Select new chat immediately
      setSelectedChat({
        id: newChat.id,
        title: newChat.title,
        projectId: newProject.id,
        projectName: newProject.name, // ✅ pass project name
      });
    } catch (err) {
      console.error(err);
    }
  };

  const renameProject = async (projectId, oldName) => {
    const newName = prompt("Rename project:", oldName);
    if (!newName) return;
    await API.put(`/projects/${projectId}`, { name: newName });
    setProjects(projects.map((p) => (p.id === projectId ? { ...p, name: newName } : p)));
  };

  const deleteProject = async (projectId) => {
    if (!window.confirm("Delete project and all chats/messages?")) return;
    await API.delete(`/projects/${projectId}`);
    setProjects(projects.filter((p) => p.id !== projectId));
    setChats((prev) => {
      const updated = { ...prev };
      delete updated[projectId];
      return updated;
    });

    // If current chat belongs to deleted project → go to Direct Chat
    if (selectedChat.projectId === projectId) {
      setSelectedChat({
        id: "direct",
        title: "Direct Chat",
        projectId: null,
        projectName: null,
      });
    }
  };

  const addChat = async (projectId) => {
    try {
      const existingChats = chats[projectId] || [];
      const newChatTitle = `Chat ${existingChats.length + 1}`;

      const res = await API.post(`/chats/${projectId}`, { title: newChatTitle });
      const newChat = res.data;

      setChats((prev) => ({
        ...prev,
        [projectId]: [...existingChats, newChat],
      }));

      // Auto-select new chat
      const project = projects.find((p) => p.id === projectId);
      setSelectedChat({
        id: newChat.id,
        title: newChat.title,
        projectId,
        projectName: project ? project.name : null, // ✅ include project name
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteChat = async (chatId, projectId) => {
    if (!window.confirm("Delete this chat?")) return;
    await API.delete(`/chats/${chatId}`);

    setChats((prev) => {
      const updatedChats = prev[projectId].filter((c) => c.id !== chatId);
      const newChatsState = { ...prev, [projectId]: updatedChats };

      // If the deleted chat was currently selected
      if (selectedChat.id === chatId) {
        if (updatedChats.length > 0) {
          const fallbackChat = updatedChats[0];
          const project = projects.find((p) => p.id === projectId);
          setSelectedChat({
            id: fallbackChat.id,
            title: fallbackChat.title,
            projectId,
            projectName: project ? project.name : null,
          });
        } else {
          // No chats left → Direct Chat
          setSelectedChat({
            id: "direct",
            title: "Direct Chat",
            projectId: null,
            projectName: null,
          });
        }
      }

      return newChatsState;
    });
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
      <div className="p-4 font-bold text-lg border-b dark:border-gray-700 dark:text-white">
        Chats
      </div>

      {/* Direct Chat */}
      <div
        onClick={() =>
          setSelectedChat({ id: "direct", title: "Direct Chat", projectId: null, projectName: null })
        }
        className={`p-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 ${
          selectedChat.id === "direct" ? "bg-gray-200 dark:bg-gray-700 font-bold" : ""
        }`}
      >
        Direct Chat
      </div>

      {/* Projects + Chats */}
      <div className="flex-1 overflow-y-auto">
        {projects.map((p) => (
          <div key={p.id} className="p-2 border-b dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span
                className="font-semibold dark:text-white cursor-pointer"
                onClick={() => fetchChats(p.id)}
              >
                {p.name}
              </span>
              <div className="space-x-2 text-sm">
                <button onClick={() => renameProject(p.id, p.name)}>✏️</button>
                <button onClick={() => deleteProject(p.id)}>🗑️</button>
                <button onClick={() => addChat(p.id)}>➕</button>
              </div>
            </div>

            <div className="ml-4 mt-1">
              {(chats[p.id] || []).map((c) => (
                <div
                  key={c.id}
                  onClick={() =>
                    setSelectedChat({
                      id: c.id,
                      title: c.title,
                      projectId: p.id,
                      projectName: p.name, // ✅ include project name
                    })
                  }
                  className={`p-2 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedChat.id === c.id ? "bg-gray-200 dark:bg-gray-700 font-bold" : ""
                  }`}
                >
                  <span className="dark:text-white">{c.title}</span>
                  <button
                    className="text-red-600 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(c.id, p.id);
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Project */}
      <button
        onClick={addProject}
        className="m-2 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
      >
        + Add Project
      </button>
    </div>
  );
}
