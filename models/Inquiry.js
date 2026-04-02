const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender ID is required"]
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Recipient ID is required"],
      refPath: "recipientType"
    },
    recipientType: {
      type: String,
      required: [true, "Recipient type is required"],
      enum: ["Handyman", "Designer", "Contractor", "Supplier"]
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
      message: {
        type: String,
        default: "",
        trim: true
      },
      repliedAt: {
        type: Date,
        default: null
      }
    },
    status: {
      type: String,
      enum: ["pending", "read", "replied", "closed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inquiry", inquirySchema);