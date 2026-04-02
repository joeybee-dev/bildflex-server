const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"]
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Target ID is required"],
      refPath: "targetType"
    },
    targetType: {
      type: String,
      required: [true, "Target type is required"],
      enum: ["Handyman", "Designer", "Contractor", "Supplier"]
    }
  },
  { timestamps: true }
);

favoriteSchema.index({ userId: 1, targetId: 1, targetType: 1 }, { unique: true });

module.exports = mongoose.model("Favorite", favoriteSchema);