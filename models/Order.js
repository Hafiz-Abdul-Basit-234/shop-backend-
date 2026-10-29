const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    address: { type: String, required: true },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 }
      }
    ],
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);