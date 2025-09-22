# 💬 Chatbot Platform

A full-stack chatbot platform built with **React (Vite) + Tailwind (frontend)** and **Node.js + Express + SQLite (backend)**.  
This assignment demonstrates authentication, project & chat management, and AI-powered responses.

---

## 🚀 Features

- 🔐 **Authentication** – Register & Login with JWT-based sessions  
- 👤 **User Profiles** – Name, Email, Password  
- 💬 **Direct Chat** – Always available as default  
- 📂 **Projects** – Create/Rename/Delete projects  
- 🗨️ **Chats under Projects** – Create/Delete multiple chats  
- 🧹 **Cascade Deletes** – Deleting a project deletes all chats/messages  
- 🤖 **AI Responses** – Integrated with OpenRouter (or any LLM API)  
- 🎨 **UI/UX** – Modern responsive design with TailwindCSS  
- 🌗 **Dark/Light Mode Support**  

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)  
- React Router  
- TailwindCSS  
- Axios  

### Backend
- Node.js + Express  
- SQLite (lightweight DB)  
- JWT (Authentication)  
- Bcrypt (Password hashing)  

---

## ⚙️ Installation & Setup

### 1. Clone the repository

git clone https://github.com/HariJohan/chatbot_platform.git
cd chatbot_platform

### 2. Backend Setup

cd backend
npm install

### 3. Create a .env file inside backend/:

PORT=5000
JWT_SECRET=your_jwt_secret
OPENROUTER_API_KEY=your_api_key_here

### 4. Start backend server:

node server.js
### 5. The backend will run at:

http://localhost:5000

### 6. Frontend Setup
cd frontend
npm install


### 7. Create a .env file inside frontend/:

VITE_API_URL=http://localhost:5000


### 8. Start frontend app:

npm run dev


### 9. The frontend will run at:

http://localhost:5173

📂 Project Structure
chatbot-platform/
│── backend/               # Express + SQLite + API
│   ├── db.js              # Database setup
│   ├── server.js          # Main server
│   ├── routes/            # Routes (auth, projects, chats, messages)
│   └── middleware/        # JWT authentication middleware
│
│── frontend/              # React + Vite + Tailwind
│   ├── src/
│   │   ├── api.js         # Axios API setup
│   │   ├── pages/         # Login, Register, Dashboard
│   │   ├── components/    # Sidebar, ChatWindow, etc.
│   │   └── App.jsx        # App routes
│
│── README.md              # Documentation

