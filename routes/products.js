const express = require("express");
const Product = require("../models/Product");
const adminAuth = require("../middleware/adminAuth");

const router = express.Router();

// Customer: sab products
router.get("/", async (req, res) => {
  const products = await Product.find().sort({ createdAt: -1 });
  res.json(products);
});

// Customer: ek product
router.get("/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
});

// Admin: product add
router.post("/", adminAuth, async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// Admin: product update
router.put("/:id", adminAuth, async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(product);
});

// Admin: product delete
router.delete("/:id", adminAuth, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
});

module.exports = router;