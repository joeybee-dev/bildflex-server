const ProfessionalProfile = require("../models/ProfessionalProfile");
const bcrypt = require("bcrypt");
const auth = require("../middlewares/auth");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const mongoose = require("mongoose");

// Register Professional Profile
module.exports.registerProfile = async (req, res) => {
  try {
    const {
      profileIcon,
      title,
      firstName,
      lastName,
      profession,
      email,
      mobileNo,
      password,
      confirmPassword,
      location,
      country,
      pitch,
      portfolioImages,
      servicesOffered
    } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).send({
        error: "Confirm password does not match password."
      });
    }

    const existingEmail = await ProfessionalProfile.findOne({ email });

    if (existingEmail) {
      return res.status(409).send({
        error: "Email already exists."
      });
    }
    console.log(req.body);

    const newProfile = new ProfessionalProfile({
      profileIcon,
      title,
      firstName,
      lastName,
      profession,
      email,
      mobileNo,
      password,
      location,
      country,
      pitch,
      portfolioImages,
      servicesOffered
    });

    const savedProfile = await newProfile.save();

    return res.status(201).send({
      message: "Professional profile registered successfully.",
      profile: {
        _id: savedProfile._id,
        title: savedProfile.title,
        firstName: savedProfile.firstName,
        lastName: savedProfile.lastName,
        profession: savedProfile.profession,
        email: savedProfile.email
      }
    });
  } 
  catch (err) {
  console.error("Register profile error:", err);

  if (err.name === "ValidationError") {
    const errors = {};

    for (let field in err.errors) {
      errors[field] = err.errors[field].message;
    }

    return res.status(400).send({
      error: "Validation failed",
      details: errors
    });
  }

    return res.status(500).send({
      error: "Failed to register professional profile."
    });
  }
};

// Login Professional Profile
module.exports.loginProfile = async (req, res) => {
  try {
    const { email, password } = req.body;

    const profile = await ProfessionalProfile.findOne({ email });

    if (!profile) {
      return res.status(404).send({
        error: "Profile not found."
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, profile.password);

    if (!isPasswordCorrect) {
      return res.status(401).send({
        error: "Incorrect email or password."
      });
    }

    const token = auth.createAccessToken(profile);

    return res.status(200).send({
      message: "Login successful.",
      access: token
    });
  } catch (err) {
    console.error("Login profile error:", err);
    return res.status(500).send({
      error: "Failed to login."
    });
  }
};

// Get Logged In Professional Profile
module.exports.getMyProfile = async (req, res) => {
  try {
    const profile = await ProfessionalProfile.findById(req.user.id).select("-password");

    if (!profile) {
      return res.status(404).send({
        error: "Profile not found."
      });
    }

    return res.status(200).send({
      profile
    });
  } catch (err) {
    console.error("Get my profile error:", err);
    return res.status(500).send({
      error: "Failed to fetch profile."
    });
  }
};

// Update Logged In Professional Profile
module.exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    user.firstName = req.body.firstName;
    user.lastName = req.body.lastName;
    user.gender = req.body.gender;
    user.birthYear = req.body.birthYear;
    user.email = req.body.email;
    user.mobileNo = req.body.mobileNo;
    user.city = req.body.city;
    user.province = req.body.province;
    user.country = req.body.country;
    user.bio = req.body.bio;
    user.notificationSettings = {
      ...user.notificationSettings?.toObject?.(),
      ...req.body.notificationSettings
    };

    await user.save();

    return res.status(200).send({
      message: "Profile updated successfully",
      user
    });
  } catch (err) {
    console.error("Update my profile error:", err);
    console.error("Request body:", req.body);
     return res.status(500).send({
       error: err.message || "Failed to update profile."
     });

    if (err.code === 11000) {
      return res.status(400).send({
        error: "Email is already in use."
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).send({
        error: Object.values(err.errors).map(e => e.message).join(", ")
      });
    }

    return res.status(500).send({
      error: err.message || "Failed to update profile."
    });
  }
};

// Send Inquiry to Professional
module.exports.sendInquiry = async (req, res) => {
  try {
    const { profileId } = req.params;
    const { senderName, senderEmail, inquiry } = req.body;

    const profile = await ProfessionalProfile.findById(profileId);

    if (!profile) {
      return res.status(404).send({
        error: "Professional profile not found."
      });
    }

    profile.messages.push({
      senderName,
      senderEmail,
      inquiry
    });

    await profile.save();

    return res.status(200).send({
      message: "Inquiry sent successfully.",
      messages: profile.messages
    });
  } catch (err) {
    console.error("Send inquiry error:", err);
    return res.status(500).send({
      error: "Failed to send inquiry."
    });
  }
};

// Reply to Inquiry
module.exports.replyToInquiry = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reply } = req.body;

    const profile = await ProfessionalProfile.findById(req.user.id);

    if (!profile) {
      return res.status(404).send({
        error: "Professional profile not found."
      });
    }

    const message = profile.messages.id(messageId);

    if (!message) {
      return res.status(404).send({
        error: "Inquiry message not found."
      });
    }

    message.isRead = true;
    message.reply = reply;

    await profile.save();

    return res.status(200).send({
      message: "Reply sent successfully.",
      updatedMessage: message
    });
  } catch (err) {
    console.error("Reply inquiry error:", err);
    return res.status(500).send({
      error: "Failed to reply to inquiry."
    });
  }
};


// Get all active professional profiles
module.exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await ProfessionalProfile.find({ isActive: true })
      .select("profileIcon title firstName lastName profession location country pitch isPremium portfolioImages")
      .sort({ createdAt: -1 });

    return res.status(200).send({
      profiles
    });
  } catch (err) {
    console.error("Get all profiles error:", err);
    return res.status(500).send({
      error: "Failed to fetch professional profiles."
    });
  }
};

// Get specific professional profile by ID
module.exports.getProfileById = async (req, res) => {
  try {
    const { profileId } = req.params;

    console.log("profileId:", profileId);

    if (!mongoose.Types.ObjectId.isValid(profileId)) {
      return res.status(400).send({
        error: "Invalid professional profile ID."
      });
    }

    const profile = await ProfessionalProfile.findById(profileId)
      .select("-password -messages -mobileNo -email");

    if (!profile) {
      return res.status(404).send({
        error: "Professional profile not found."
      });
    }

    return res.status(200).send({ profile });
  } catch (err) {
    console.error("Get profile by ID error:", err);
    return res.status(500).send({
      error: "Failed to fetch professional profile."
    });
  }
};

// Delete own professional profile
module.exports.deleteMyProfile = async (req, res) => {
  try {
    const deletedProfile = await ProfessionalProfile.findByIdAndDelete(req.user.id);

    if (!deletedProfile) {
      return res.status(404).send({
        error: "Professional profile not found."
      });
    }

    return res.status(200).send({
      message: "Professional profile deleted successfully."
    });
  } catch (err) {
    console.error("Delete my profile error:", err);
    return res.status(500).send({
      error: "Failed to delete professional profile."
    });
  }
};


// Get all messages of logged in professional
module.exports.getMyMessages = async (req, res) => {
  try {
    const profile = await ProfessionalProfile.findById(req.user.id).select("messages");

    if (!profile) {
      return res.status(404).send({
        error: "Professional profile not found."
      });
    }

    return res.status(200).send({
      messages: profile.messages
    });
  } catch (err) {
    console.error("Get my messages error:", err);
    return res.status(500).send({
      error: "Failed to fetch messages."
    });
  }
};

// Get one specific message of logged in professional
module.exports.getMyMessageById = async (req, res) => {
  try {
    const profile = await ProfessionalProfile.findById(req.user.id).select("messages");

    if (!profile) {
      return res.status(404).send({
        error: "Professional profile not found."
      });
    }

    const message = profile.messages.id(req.params.messageId);

    if (!message) {
      return res.status(404).send({
        error: "Message not found."
      });
    }

    return res.status(200).send({
      message
    });
  } catch (err) {
    console.error("Get my message by ID error:", err);
    return res.status(500).send({
      error: "Failed to fetch message."
    });
  }
};

// Delete one message of logged in professional
module.exports.deleteMyMessage = async (req, res) => {
  try {
    const profile = await ProfessionalProfile.findById(req.user.id);

    if (!profile) {
      return res.status(404).send({
        error: "Professional profile not found."
      });
    }

    const message = profile.messages.id(req.params.messageId);

    if (!message) {
      return res.status(404).send({
        error: "Message not found."
      });
    }

    message.deleteOne();
    await profile.save();

    return res.status(200).send({
      message: "Message deleted successfully."
    });
  } catch (err) {
    console.error("Delete my message error:", err);
    return res.status(500).send({
      error: "Failed to delete message."
    });
  }
};


// Upload only, return Cloudinary URL
module.exports.uploadProfileIcon = async (req, res) => {
  try {
    console.log("req.file:", req.file);

    if (!req.file) {
      return res.status(400).send({
        error: "No image file uploaded."
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, "profile-icons");

    console.log("cloudinary result:", result);

    return res.status(200).send({
      message: "Image uploaded successfully.",
      imageUrl: result.secure_url,
      publicId: result.public_id
    });
  } catch (err) {
    console.error("Upload profile icon error:", err);
    return res.status(500).send({
      error: err.message || "Failed to upload image."
    });
  }
};