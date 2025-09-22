const express = require("express");
const db = require("../db");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const axios = require("axios");

// ✅ Resolve "direct" into actual chat ID from DB
function resolveChatId(req, callback) {
  const userId = req.user.id;
  let { chatId } = req.params;

  if (chatId === "direct") {
    db.get(
      `SELECT id FROM chats WHERE user_id = ? AND project_id IS NULL AND title = "Direct Chat"`,
      [userId],
      (err, row) => {
        if (err) return callback(err);
        if (!row) return callback(new Error("Direct Chat not found"));
        callback(null, row.id);
      }
    );
  } else {
    callback(null, chatId);
  }
}

// ✅ Middleware: check chat ownership
function verifyChatOwnership(req, res, next) {
  resolveChatId(req, (err, realChatId) => {
    if (err) {
      console.error("Chat resolution error:", err.message);
      return res.status(400).json({ error: err.message });
    }

    req.realChatId = realChatId; // store resolved chatId
    const userId = req.user.id;

    db.get(
      `SELECT * FROM chats WHERE id = ? AND user_id = ?`,
      [realChatId, userId],
      (err, chat) => {
        if (err) {
          console.error("DB error checking chat ownership:", err.message);
          return res.status(500).json({ error: "DB error" });
        }
        if (!chat) {
          return res
            .status(403)
            .json({ error: "Not authorized for this chat" });
        }
        next();
      }
    );
  });
}

// ✅ List messages
router.get("/:chatId", authMiddleware, verifyChatOwnership, (req, res) => {
  db.all(
    `SELECT * FROM messages WHERE chat_id = ? ORDER BY timestamp ASC`,
    [req.realChatId],
    (err, rows) => {
      if (err) {
        console.error("DB error fetching messages:", err.message);
        return res.status(500).json({ error: "DB error fetching messages" });
      }
      res.json(rows);
    }
  );
});

// ✅ Send message + AI reply
router.post("/:chatId", authMiddleware, verifyChatOwnership, async (req, res) => {
  const { text } = req.body;
  const chatId = req.realChatId;
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
          if (err) {
            console.error("DB error inserting user message:", err.message);
            reject(err);
          } else {
            resolve({ id: this.lastID, sender_id: senderId, text });
          }
        }
      );
    });

    // Default AI response
    let aiText = "⚠️ AI not available right now";

    // Try calling OpenRouter API
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-3.5-turbo",
          messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: text },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );

      aiText =
        response.data?.choices?.[0]?.message?.content?.trim() ||
        "⚠️ AI did not return a response";
    } catch (apiErr) {
      console.error(
        "AI API Error:",
        apiErr.response?.data || apiErr.message || apiErr
      );
    }

    // Save AI response (fallback or real)
    const aiResult = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO messages (chat_id, sender_id, text) VALUES (?, NULL, ?)`,
        [chatId, aiText],
        function (err) {
          if (err) {
            console.error("DB error inserting AI response:", err.message);
            reject(err);
          } else {
            resolve({ id: this.lastID, sender_id: null, text: aiText });
          }
        }
      );
    });

    res.json([userResult, aiResult]);
  } catch (err) {
    console.error("Server error in /messages:", err.message || err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;
