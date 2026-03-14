const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product"
  },
  quantity: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  cartItems: {
    type: [cartItemSchema],
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  orderedOn: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Cart", cartSchema);