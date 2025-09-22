const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  console.log("📩 Register request body:", req.body); // 👈 add this line

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // check duplicate
    const existing = await db.get("SELECT * FROM users WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.run("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", [
      name,
      email,
      hashedPassword,
    ]);

    return res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Error in /register:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
// const express = require("express");
// // const bcrypt = require("bcrypt");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const db = require("../db");
// const router = express.Router();

// router.post("/register", (req, res) => {
//   const { name, email, password, confirmPassword } = req.body;
//   if (!name || !email || !password || !confirmPassword) {
//     return res.status(400).json({ error: "All fields required" });
//   }
//   if (password !== confirmPassword) {
//     return res.status(400).json({ error: "Passwords do not match" });
//   }

//   const password_hash = bcrypt.hashSync(password, 10);

//   db.run(
//     `INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
//     [name, email, password_hash],
//     function (err) {
//       if (err) return res.status(400).json({ error: "Email already exists" });

//       // Create default Direct Chat for new user
//       db.run(`INSERT INTO chats (project_id, title) VALUES (?, ?)`, [null, "Direct Chat"]);

//       res.json({ success: true, message: "User registered" });
//     }
//   );
// });

// router.post("/login", (req, res) => {
//   const { email, password } = req.body;
//   db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, user) => {
//     if (!user) return res.status(400).json({ error: "User not found" });

//     const match = bcrypt.compareSync(password, user.password_hash);
//     if (!match) return res.status(400).json({ error: "Invalid password" });

//     const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
//     res.json({ token });
//   });
// });

// module.exports = router;
