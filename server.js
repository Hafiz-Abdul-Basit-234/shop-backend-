const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("./models/Admin");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174"
  ]
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Shop backend is running" });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is working"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

async function startServer() {
  try {
    if (
      !process.env.MONGODB_URI ||
      !process.env.JWT_SECRET ||
      !process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD
    ) {
      throw new Error("Please configure all required .env values");
    }

    if (process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected successfully");

    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();

    const existingAdmin = await Admin.findOne({ email });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(
        process.env.ADMIN_PASSWORD,
        12
      );

      await Admin.create({
        email,
        password: hashedPassword,
        role: "admin"
      });

      console.log("Initial admin account created");
    } else {
      console.log("Admin account already exists");
    }

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
