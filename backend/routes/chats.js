const express = require("express");
const db = require("../db");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// ✅ Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * Create Direct Chat (no project)
 * POST /chats
 */
router.post("/", (req, res) => {
  const { title } = req.body;
  const userId = req.user.id;

  if (!title || title.trim() === "") {
    return res.status(400).json({ error: "Chat title is required" });
  }

  db.run(
    `INSERT INTO chats (project_id, user_id, title) VALUES (?, ?, ?)`,
    [null, userId, title],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, project_id: null, user_id: userId, title });
    }
  );
});

/**
 * Create chat inside a project
 * POST /chats/:projectId
 */
router.post("/:projectId", (req, res) => {
  const { title } = req.body;
  const projectId = req.params.projectId;
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

/**
 * List chats of a project (for the logged-in user)
 * GET /chats/project/:projectId
 */
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

/**
 * List ALL chats for logged-in user (Direct + Project chats)
 * GET /chats
 */
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

/**
 * Delete chat (prevent deleting Direct Chat)
 * DELETE /chats/:id
 */
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
