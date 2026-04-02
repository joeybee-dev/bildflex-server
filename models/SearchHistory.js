const mongoose = require("mongoose");

const searchHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"]
    },
    keyword: {
      type: String,
      default: "",
      trim: true
    },
    providerType: {
      type: String,
      enum: ["Handyman", "Designer", "Contractor", "Supplier", ""],
      default: ""
    },
    city: {
      type: String,
      default: "",
      trim: true
    },
    province: {
      type: String,
      default: "",
      trim: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SearchHistory", searchHistorySchema);