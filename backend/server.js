const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const chatRoutes = require("./routes/chats");
const messageRoutes = require("./routes/messages");
const authMiddleware = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/projects", authMiddleware, projectRoutes);
app.use("/chats", authMiddleware, chatRoutes);
app.use("/messages", authMiddleware, messageRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
