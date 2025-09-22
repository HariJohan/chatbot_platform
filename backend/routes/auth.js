const express = require("express");
// const bcrypt = require("bcrypt");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const router = express.Router();

router.post("/register", (req, res) => {
  const { name, email, password, confirmPassword } = req.body;
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: "All fields required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  const password_hash = bcrypt.hashSync(password, 10);

  db.run(
    `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
    [name, email, password_hash],
    function (err) {
      if (err) return res.status(400).json({ error: "Email already exists" });

      // Create default Direct Chat for new user
      db.run(`INSERT INTO chats (project_id, title) VALUES (?, ?)`, [null, "Direct Chat"]);

      res.json({ success: true, message: "User registered" });
    }
  );
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
    if (!user) return res.status(400).json({ error: "User not found" });

    const match = bcrypt.compareSync(password, user.password_hash);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  });
});

module.exports = router;
