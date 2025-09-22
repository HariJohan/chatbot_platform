const express = require("express");
const db = require("../db");
const router = express.Router();

// Create project
router.post("/", (req, res) => {
  const { name } = req.body;
  const userId = req.user.id;

  db.run(`INSERT INTO projects (user_id, name) VALUES (?, ?)`, [userId, name], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID, name });
  });
});

// List projects
router.get("/", (req, res) => {
  const userId = req.user.id;
  db.all(`SELECT * FROM projects WHERE user_id = ?`, [userId], (err, rows) => {
    if (err) return res.status(400).json({ error: err.message });
    res.json(rows);
  });
});

// Rename project
router.put("/:id", (req, res) => {
  const { name } = req.body;
  db.run(`UPDATE projects SET name = ? WHERE id = ?`, [name, req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});

// Delete project (cascade delete chats/messages)
router.delete("/:id", (req, res) => {
  db.run(`DELETE FROM projects WHERE id = ?`, [req.params.id], function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ success: true });
  });
});

module.exports = router;
