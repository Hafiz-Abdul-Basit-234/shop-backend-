const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password required"
      });
    }

    const admin = await Admin.findOne({
      email: email.toLowerCase().trim()
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      admin.password
    );

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        id: admin._id.toString(),
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed"
    });
  }
});

module.exports = router;