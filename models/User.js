const mongoose = require("mongoose");

const notificationSettingsSchema = new mongoose.Schema(
  {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    smsNotifications: {
      type: Boolean,
      default: false
    },
    inquiryNotifications: {
      type: Boolean,
      default: true
    },
    marketingNotifications: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

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

    fullName: {
      type: String,
      trim: true
    },

    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: ["Male", "Female", "Prefer not to say", "Other"]
    },

    birthYear: {
      type: Number,
      min: 1900,
      max: new Date().getFullYear(),
      default: null
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true
    },

    mobileNo: {
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

    bio: {
      type: String,
      default: "",
      trim: true
    },

    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProfessionalProfile"
      }
    ],

    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified"
    },

    notificationSettings: {
      type: notificationSettingsSchema,
      default: () => ({})
    },

    userType: {
      type: String,
      enum: ["user"],
      default: "user"
    },

    accountStatus: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active"
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isAdmin: {
      type: Boolean,
      default: false
    },

    isArchived: {
      type: Boolean,
      default: false
    },

    subscriptionPlan: {
      type: String,
      enum: ["free", "basic", "standard", "premium"],
      default: "free"
    },

    password: {
      type: String,
      required: [true, "Password is required"]
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
  {
    timestamps: true
  }
);

userSchema.pre("save", function () {
  this.fullName = `${this.firstName || ""} ${this.lastName || ""}`
    .replace(/\s+/g, " ")
    .trim();

  if (this.isArchived) {
    this.accountStatus = "archived";
    this.isActive = false;
  } else if (!this.isActive) {
    this.accountStatus = "inactive";
  } else {
    this.accountStatus = "active";
  }
});

module.exports = mongoose.model("User", userSchema);