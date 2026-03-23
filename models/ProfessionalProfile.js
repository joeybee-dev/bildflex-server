const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const messageSchema = new mongoose.Schema(
  {
    senderName: {
      type: String,
      required: [true, "Sender name is required."],
      trim: true
    },
    senderEmail: {
      type: String,
      required: [true, "Sender email is required."],
      trim: true,
      match: [/.+@.+\..+/, "Please enter a valid email address."]
    },
    inquiry: {
      type: String,
      required: [true, "Inquiry is required."],
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
    }

  },
  { timestamps: true }
);

const portfolioImageSchema = new mongoose.Schema(
  {
    imageUrl: {
      type: String,
      required: [false, "Image URL is required."]
    },
    caption: {
      type: String,
      default: "",
      trim: true
    },
    width: {
      type: Number,
      default: 500
    },
    height: {
      type: Number,
      default: 400
    }
  },
  { _id: false }
);

const professionalProfileSchema = new mongoose.Schema(
  {
    profileIcon: {
      type: String,
      default: ""
    },

    title: {
      type: String,
      enum: ["Engr.", "Arch."],
      required: [false, "Title is required."]
    },

    firstName: {
      type: String,
      required: [true, "First name is required."],
      trim: true,
      match: [/^[A-Z][a-zA-Z\s.-]*$/, "First name must start with a capital letter."]
    },

    lastName: {
      type: String,
      required: [true, "Last name is required."],
      trim: true,
      match: [/^[A-Z][a-zA-Z\s.-]*$/, "Last name must start with a capital letter."]
    },

    profession: {
      type: String,
      required: [true, "Profession is required."],
      trim: true,
      match: [/^[A-Z][a-zA-Z\s.-]*$/, "Profession must start with a capital letter."]
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Please enter a valid email address."]
    },

    mobileNo: {
      type: String,
      required: [true, "Mobile number is required."],
      match: [/^\d{11,}$/, "Mobile number must be at least 11 digits."]
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/,
        "Password must include uppercase, lowercase, number, special character, and be at least 8 characters."
      ]
    },

    location: {
      type: String,
      required: [true, "Location is required."],
      trim: true,
      match: [/^[A-Z][a-zA-Z\s,.-]*$/, "Location must start with a capital letter."]
    },

    country: {
      type: String,
      required: [true, "Country is required."],
      enum: [
        "Philippines",
        "United States",
        "Canada",
        "Australia",
        "United Kingdom",
        "Singapore",
        "Japan",
        "South Korea",
        "United Arab Emirates",
        "Saudi Arabia"
      ]
    },

    isAdmin: {
      type: Boolean,
      default: false
    },

    isActive: {
      type: Boolean,
      default: true
    },

    isPremium: {
      type: Boolean,
      default: false
    },

    pitch: {
      type: String,
      default: "",
      trim: true
    },

    portfolioImages: [portfolioImageSchema],

    servicesOffered: {
      type: String,
      default: "",
      trim: true
    },

    messages: [messageSchema]
  },
  { timestamps: true }
);

professionalProfileSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model("ProfessionalProfile", professionalProfileSchema);