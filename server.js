
require("dotenv").config();

const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("./models/Admin");
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const orderRoutes = require("./routes/orders");

const app = express();

// ===================================
// 1. CORS CONFIGURATION
// ===================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5175",
  "https://dashboard-u19z.vercel.app",
  "https://shop-website-ubw7.vercel.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// ===================================
// 2. MIDDLEWARE
// ===================================

app.use(express.json());

// ===================================
// 3. MONGODB CONNECTION
// ===================================

let dbConnectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing");
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .then(async () => {
        console.log("MongoDB connected successfully");

        // Create initial admin if it does not exist
        const email = process.env.ADMIN_EMAIL
          ?.trim()
          .toLowerCase();

        const password = process.env.ADMIN_PASSWORD;

        if (email && password) {
  const existingAdmin = await Admin.findOne({ email });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(password, 12);

    await Admin.create({
      email,
      password: hashedPassword,
      role: "admin"
    });

    console.log("Initial admin account created");
  }
}

        const existingAdmin = await Admin.findOne({ email });

        if (!existingAdmin) {
          const hashedPassword = await bcrypt.hash(password, 12);

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

// ===================================
// 4. SERVER ENVIRONMENT CHECK
// ===================================

app.use(async (req, res, next) => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
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
// ===================================
// 5. HEALTH CHECK ROUTES
// ===================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Shop backend is running"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is working",
    database: mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected"
  });
});

// ===================================
// 6. API ROUTES
// ===================================

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// ===================================
// 7. NOT FOUND ROUTE
// ===================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found"
  });
});

// ===================================
// 8. ERROR HANDLER
// ===================================

app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});

// ===================================
// 9. LOCAL SERVER
// ===================================

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

// ===================================
// 10. EXPORT FOR VERCEL
// ===================================

module.exports = app;
