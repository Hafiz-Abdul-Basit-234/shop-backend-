const express = require("express");
const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const adminAuth = require("../middleware/adminauth");

const router = express.Router();

// Customer: order place
router.post("/", async (req, res) => {
  try {
    const { customerName, customerEmail, address, items } =
      req.body;

    if (
      !customerName?.trim() ||
      !customerEmail?.trim() ||
      !address?.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Complete customer and order details required"
      });
    }

    const orderItems = [];
    let total = 0;

    for (const item of items) {
      if (
        !mongoose.isValidObjectId(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          message: "Invalid product or quantity"
        });
      }

      const product = await Product.findOne({
        _id: item.productId,
        isActive: true
      });

      if (!product || product.stock < item.quantity) {
        return res.status(400).json({
          message: "Product unavailable or insufficient stock"
        });
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });

      total += product.price * item.quantity;
    }

    const order = await Order.create({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      address: address.trim(),
      items: orderItems,
      total
    });

    res.status(201).json({
      message: "Order placed",
      order
    });
  } catch (error) {
    res.status(500).json({
      message: "Order create nahi hua"
    });
  }
});

// Admin: tamam orders
router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Orders load nahi huay"
    });
  }
});

// Admin: order status update
router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled"
    ];

    if (!allowedStatuses.includes(req.body.status)) {
      return res.status(400).json({
        message: "Invalid order status"
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    res.json(order);
  } catch (error) {
    res.status(400).json({
      message: "Order status update nahi hua"
    });
  }
});

module.exports = router;