const express = require("express");
const db = require("../db");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const axios = require("axios");

// List messages
router.get("/:chatId", authMiddleware, (req, res) => {
  db.all(
    `SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC`,
    [req.params.chatId],
    (err, rows) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Send message + AI reply
router.post("/:chatId", authMiddleware, async (req, res) => {
  const { text } = req.body;
  const chatId = req.params.chatId;
  const senderId = req.user.id;

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
        model: "openai/gpt-3.5-turbo", // change to another model if desired
        messages: [{ role: "user", content: text }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiText = response.data.choices[0].message.content;

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
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
