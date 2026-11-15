
const express = require("express");
const mongoose = require("mongoose");
const sendOrderEmail = require("../utils/orderEmail");
const Order = require("../models/Order");
const Product = require("../models/Product");
const adminAuth = require("../middleware/adminauth");

const router = express.Router();

// ===================================
// CUSTOMER: PLACE ORDER
// ===================================

router.post("/", async (req, res) => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      address,
      items,
    } = req.body;

    // Validate customer details
    if (
      !customerName?.trim() ||
      !customerEmail?.trim() ||
      !customerPhone?.trim() ||
      !address?.trim()
    ) {
      return res.status(400).json({
        message: "All customer details are required",
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(customerEmail)) {
      return res.status(400).json({
        message: "Invalid email address",
      });
    }

    // Validate products
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your order must contain products",
      });
    }

    const orderItems = [];
    let subtotal = 0;

    // Get actual products and prices from database
    for (const item of items) {
      if (
        !mongoose.isValidObjectId(item.productId) ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1
      ) {
        return res.status(400).json({
          message: "Invalid product ID or quantity",
        });
      }

      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          message: "Product not found",
        });
      }

      if (product.stock < Number(item.quantity)) {
        return res.status(400).json({
          message: `${product.name} is out of stock`,
        });
      }

      const quantity = Number(item.quantity);

      orderItems.push({
        product: product._id,
        productName: product.name,
        productImage: product.image,
        quantity,
        price: product.price,
      });

      subtotal += product.price * quantity;
    }

    // Calculate amount on backend
    const discount = Number((subtotal * 0.20).toFixed(2));
    const deliveryFee = orderItems.length > 0 ? 15 : 0;

    const total = Number(
      (subtotal - discount + deliveryFee).toFixed(2)
    );

    // Save order in MongoDB
    const order = await Order.create({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.trim(),
      address: address.trim(),
      items: orderItems,
      subtotal,
      discount,
      deliveryFee,
      total,
    });

    // Send confirmation email to customer
    try {
      await sendOrderEmail(order);
      console.log("Order confirmation email sent successfully");
    } catch (emailError) {
      console.error(
        "ORDER EMAIL ERROR:",
        emailError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });

  } catch (error) {
    console.error("ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to place order",
    });
  }
});


// ===================================
// ADMIN: GET ALL ORDERS
// ===================================

router.get("/", adminAuth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("items.product")
      .sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    res.status(500).json({
      message: "Orders could not be loaded",
    });
  }
});


// ===================================
// ADMIN: UPDATE ORDER STATUS
// ===================================

router.patch("/:id/status", adminAuth, async (req, res) => {
  try {
    const allowedStatuses = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    const { status } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid order status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated",
      order,
    });

  } catch (error) {
    console.error("UPDATE ORDER STATUS ERROR:", error);

    res.status(500).json({
      message: "Order status update failed",
    });
  }
});

module.exports = router;
