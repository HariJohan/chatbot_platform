const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const chatRoutes = require("./routes/chats");
const messageRoutes = require("./routes/messages");
const authMiddleware = require("./middleware/auth");

const app = express();

// ✅ Allowed origins (local + deployed frontend)
const allowedOrigins = [
  "http://localhost:5173", // for local dev (Vite)
  "https://stellular-churros-f0988a.netlify.app", // your Netlify frontend
];

// ✅ CORS config
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // allow cookies/authorization headers
  })
);

app.use(express.json());

// ✅ Routes
app.use("/auth", authRoutes);
app.use("/projects", authMiddleware, projectRoutes);
app.use("/chats", authMiddleware, chatRoutes);
app.use("/messages", authMiddleware, messageRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
