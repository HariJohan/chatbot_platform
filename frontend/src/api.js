import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
});

// 🔑 Attach JWT token automatically
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

//
// ===== AUTH ROUTES =====
//
export const register = (data) => API.post("/auth/register", data);
export const login = (data) => API.post("/auth/login", data);

//
// ===== CHAT ROUTES =====
//
export const getChats = () => API.get("/chats");
export const createChat = (title) => API.post("/chats", { title });
export const deleteChat = (chatId) => API.delete(`/chats/${chatId}`);

//
// ===== MESSAGE ROUTES =====
//
export const getMessages = (chatId) => API.get(`/messages/${chatId}`);
export const sendMessage = (chatId, text) =>
  API.post(`/messages/${chatId}`, { text });

export default API;
