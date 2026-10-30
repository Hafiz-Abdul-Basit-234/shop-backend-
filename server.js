
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

// Allowed frontend URLs
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.CLIENT_URL,
  process.env.ADMIN_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  }
}));

app.use(express.json());

// MongoDB connection reuse
let dbConnectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose.connect(process.env.MONGODB_URI)
      .then(async () => {
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
        }
      })
      .catch((error) => {
        dbConnectionPromise = null;
        throw error;
      });
  }

  await dbConnectionPromise;
}

// Connect database before API requests
app.use(async (req, res, next) => {
  try {
    if (
      !process.env.MONGODB_URI ||
      !process.env.JWT_SECRET ||
      !process.env.ADMIN_EMAIL ||
      !process.env.ADMIN_PASSWORD
    ) {
      throw new Error("Required environment variables are missing");
    }

    if (process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be at least 32 characters");
    }

    await connectDB();
    next();
  } catch (error) {
    console.error("Database error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server or database connection error"
    });
  }
});

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Shop backend is running" });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
    database: "connected"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// Local development only
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
