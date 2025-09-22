const express = require("express");
const db = require("../db");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const axios = require("axios");

// ✅ Middleware to check if chat belongs to the logged-in user
function verifyChatOwnership(req, res, next) {
  const userId = req.user.id;
  const chatId = req.params.chatId;

  db.get(`SELECT * FROM chats WHERE id = ? AND user_id = ?`, [chatId, userId], (err, chat) => {
    if (err) return res.status(500).json({ error: "DB error" });
    if (!chat) return res.status(403).json({ error: "Not authorized for this chat" });
    next();
  });
}

// ✅ List messages (user can only view their own chats)
router.get("/:chatId", authMiddleware, verifyChatOwnership, (req, res) => {
  db.all(
    `SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC`,
    [req.params.chatId],
    (err, rows) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json(rows);
    }
  );
});

// ✅ Send message + AI reply
router.post("/:chatId", authMiddleware, verifyChatOwnership, async (req, res) => {
  const { text } = req.body;
  const chatId = req.params.chatId;
  const senderId = req.user.id;

  if (!text || text.trim() === "") {
    return res.status(400).json({ error: "Message text is required" });
  }

  try {
    // Save user message
    const userResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO messages (chat_id, sender_id, text) VALUES (?, ?, ?)`,
        [chatId, senderId, text],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, sender_id: senderId, text });
        }
      );
    });

    // Call OpenRouter API
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo", // you can swap this for another model
        messages: [{ role: "user", content: text }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiText = response.data.choices?.[0]?.message?.content || "⚠️ No response from AI";

    // Save AI response
    const aiResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO messages (chat_id, sender_id, text) VALUES (?, NULL, ?)`,
        [chatId, aiText],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, sender_id: null, text: aiText });
        }
      );
    });

    res.json([userResult, aiResult]);
  } catch (err) {
    console.error("AI API Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
