const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"]
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Provider ID is required"],
      refPath: "providerType"
    },
    providerType: {
      type: String,
      required: [true, "Provider type is required"],
      enum: ["Handyman", "Designer", "Contractor", "Supplier"]
    },
    inquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inquiry",
      default: null
    },
    serviceTitle: {
      type: String,
      required: [true, "Service title is required"],
      trim: true
    },
    serviceDescription: {
      type: String,
      default: "",
      trim: true
    },
    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"]
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "ongoing", "completed", "cancelled"],
      default: "pending"
    },
    notes: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);