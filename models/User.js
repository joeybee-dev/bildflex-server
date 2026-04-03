const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    profilePhoto: {
      type: String,
      default: ""
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true
    },
    lastName: {
      type: String,
      default: "",
      trim: true
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "Other", "Prefer not to say"]
    },
    birthYear: {
      type: Number,
      min: [1900, "Birth year is too old"],
      max: [new Date().getFullYear(), "Birth year cannot be in the future"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"]
    },
    mobileNumber: {
      type: String,
      default: "",
      trim: true
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true
    },
    province: {
      type: String,
      default: "",
      trim: true
    },
    country: {
      type: String,
      default: "Philippines",
      trim: true
    },
    aboutMe: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "About me must not exceed 1000 characters"]
    },
    userType: {
      type: String,
      default: "user",
      enum: ["user", "admin"]
    },
    accountStatus: {
      type: String,
      default: "active",
      enum: ["active", "suspended", "archived", "pending"]
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    subscriptionPlan: {
      type: String,
      default: "basic",
      enum: ["basic", "standard", "premium"]
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"]
    },
    passwordResetToken: {
      type: String,
      default: ""
    },
    passwordResetExpires: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  try {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);

  } catch (error) {

  }
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);