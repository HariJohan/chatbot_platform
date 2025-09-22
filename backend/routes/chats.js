const express = require("express");
const db = require("../db");
const router = express.Router();

// Create chat inside project
router.post("/:projectId", (req, res) => {
  const { title } = req.body;
  const projectId = req.params.projectId;

  db.run(`INSERT INTO chats (project_id, title) VALUES (?, ?)`, [projectId, title], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, title });
  });
});

// List chats of a project
router.get("/:projectId", (req, res) => {
  db.all(`SELECT * FROM chats WHERE project_id = ?`, [req.params.projectId], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// Delete chat (but prevent deleting Direct Chat)
router.delete("/:id", (req, res) => {
  const chatId = req.params.id;

  db.get(`SELECT project_id, title FROM chats WHERE id = ?`, [chatId], (err, chat) => {
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    if (chat.project_id === null && chat.title === "Direct Chat") {
      return res.status(400).json({ error: "Cannot delete Direct Chat" });
    }

    db.run(`DELETE FROM chats WHERE id = ?`, [chatId], function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ success: true });
    });
  });
});

module.exports = router;
