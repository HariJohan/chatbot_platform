const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// ✅ Apply authentication middleware to all routes
router.use(authMiddleware);

// Create chat inside project (or standalone if no project)
router.post("/:projectId?", (req, res) => {
  const { title } = req.body;
  const projectId = req.params.projectId || null;
  const userId = req.user.id;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Chat title is required" });
  }

  db.run(
    `INSERT INTO chats (project_id, user_id, title) VALUES (?, ?, ?)`,
    [projectId, userId, title],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, project_id: projectId, user_id: userId, title });
    }
  );
});

// List chats of a project (only for the logged-in user)
router.get("/project/:projectId", (req, res) => {
  const userId = req.user.id;
  const projectId = req.params.projectId;

  db.all(
    `SELECT * FROM chats WHERE project_id = ? AND user_id = ? ORDER BY id DESC`,
    [projectId, userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// List ALL chats for logged-in user (Direct Chat + Project Chats)
router.get("/", (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT * FROM chats WHERE user_id = ? ORDER BY id DESC`,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Delete chat (but prevent deleting Direct Chat)
router.delete("/:id", (req, res) => {
  const chatId = req.params.id;
  const userId = req.user.id;

  db.get(
    `SELECT * FROM chats WHERE id = ? AND user_id = ?`,
    [chatId, userId],
    (err, chat) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!chat) return res.status(404).json({ error: "Chat not found" });

      if (chat.project_id === null && chat.title === "Direct Chat") {
        return res.status(400).json({ error: "Cannot delete Direct Chat" });
      }

      db.run(
        `DELETE FROM chats WHERE id = ? AND user_id = ?`,
        [chatId, userId],
        function (err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, message: "Chat deleted" });
        }
      );
    }
  );
});

module.exports = router;

