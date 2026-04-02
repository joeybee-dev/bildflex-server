const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Sender ID is required"],
      refPath: "senderType"
    },
    senderType: {
      type: String,
      required: [true, "Sender type is required"],
      enum: ["User", "Handyman", "Designer", "Contractor", "Supplier", "Admin"]
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Recipient ID is required"],
      refPath: "recipientType"
    },
    recipientType: {
      type: String,
      required: [true, "Recipient type is required"],
      enum: ["User", "Handyman", "Designer", "Contractor", "Supplier", "Admin"]
    },
    messageCategory: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user"
    },
    isAdminMessage: {
      type: Boolean,
      default: false
    },
    inquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inquiry",
      default: null
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null
    },
    subject: {
      type: String,
      default: "",
      trim: true
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true
    },
    reply: {
      type: String,
      default: "",
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "archived"],
      default: "sent"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);