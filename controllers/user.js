const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const auth = require("../middlewares/auth");
const mongoose = require("mongoose");
const sendEmail = require("../utils/sendEmail");

const JWT_SECRET = process.env.JWT_SECRET;
const CLIENT_URL = process.env.CLIENT_URL;

// Register user
module.exports.registerUser = async (req, res) => {
  try {
    const { 
      firstName,
      lastName,
      gender,
      birthYear,
      email,
      mobileNo,
      city,
      province,
      country,
      bio,
      password
    } = req.body;

    if (!firstName || !gender || !email || !city || !password) {
      return res.status(400).send({
        error: "First name, gender, email, city, and password are required."
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    if (existingUser) {
      return res.status(409).send({
        error: "Email already exists."
      });
    }

    if (password.length < 8) {
      return res.status(400).send({
        error: "Password must be at least 8 characters long."
      });
    }

    const newUser = new User({
      profilePhoto: "",
      firstName: firstName.trim(),
      lastName: lastName ? lastName.trim() : "",
      gender,
      birthYear: birthYear || null,
      email: email.toLowerCase().trim(),
      mobileNo: mobileNo ? mobileNo.trim() : "",
      city: city.trim(),
      province: province ? province.trim() : "",
      country: country ? country.trim() : "Philippines",
      bio: bio ? bio.trim() : "",
      password: bcrypt.hashSync(password, 10)
    });

    const savedUser = await newUser.save();

    return res.status(201).send({
      message: "User registered successfully.",
      user: {
        _id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        fullName: savedUser.fullName,
        email: savedUser.email,
        gender: savedUser.gender,
        city: savedUser.city,
        country: savedUser.country
      }
    });
  } catch (err) {
    console.error("Register user error:", err);
    return res.status(500).send({
      error: "Failed to register user."
    });
  }
};

// Login user
module.exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send({
        error: "Email and password are required."
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    if (user.isArchived || user.accountStatus === "archived") {
      return res.status(403).send({
        error: "This account is archived."
      });
    }

    if (!user.isActive || user.accountStatus === "inactive") {
      return res.status(403).send({
        error: "This account is inactive."
      });
    }

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).send({
        error: "Incorrect email or password."
      });
    }

    return res.status(200).send({
      message: "User logged in successfully.",
      access: auth.createAccessToken(user)
    });
  } catch (err) {
    console.error("Login user error:", err);
    return res.status(500).send({
      error: "Failed to login user."
    });
  }
};

// Get logged-in user details
module.exports.getUserDetails = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    return res.status(200).send({ user });
  } catch (err) {
    console.error("Get user details error:", err);
    return res.status(500).send({
      error: "Failed to fetch user details."
    });
  }
};

// Update logged-in user
module.exports.updateUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      profilePhoto,
      firstName,
      lastName,
      gender,
      birthYear,
      mobileNo,
      city,
      province,
      country,
      bio,
      notificationSettings,
      subscriptionPlan
    } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (gender !== undefined) user.gender = gender;
    if (birthYear !== undefined) user.birthYear = birthYear;
    if (mobileNo !== undefined) user.mobileNo = mobileNo.trim();
    if (city !== undefined) user.city = city.trim();
    if (province !== undefined) user.province = province.trim();
    if (country !== undefined) user.country = country.trim();
    if (bio !== undefined) user.bio = bio.trim();

    if (notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings.toObject(),
        ...notificationSettings
      };
    }

    if (subscriptionPlan !== undefined) {
      user.subscriptionPlan = subscriptionPlan;
    }

    const updatedUser = await user.save();

    return res.status(200).send({
      message: "User updated successfully.",
      user: {
        _id: updatedUser._id,
        profilePhoto: updatedUser.profilePhoto,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        fullName: updatedUser.fullName,
        gender: updatedUser.gender,
        birthYear: updatedUser.birthYear,
        email: updatedUser.email,
        mobileNo: updatedUser.mobileNo,
        city: updatedUser.city,
        province: updatedUser.province,
        country: updatedUser.country,
        bio: updatedUser.bio,
        favorites: updatedUser.favorites,
        verificationStatus: updatedUser.verificationStatus,
        notificationSettings: updatedUser.notificationSettings,
        userType: updatedUser.userType,
        accountStatus: updatedUser.accountStatus,
        isActive: updatedUser.isActive,
        isAdmin: updatedUser.isAdmin,
        isArchived: updatedUser.isArchived,
        subscriptionPlan: updatedUser.subscriptionPlan
      }
    });
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).send({
      error: "Failed to update user."
    });
  }
};

// Get all users (Admin only)
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    return res.status(200).send({ users });
  } catch (err) {
    console.error("Get all users error:", err);
    return res.status(500).send({
      error: "Failed to fetch users."
    });
  }
};

// Archive user (Admin only)
module.exports.archiveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({
        error: "Invalid user ID."
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    user.isArchived = true;
    user.isActive = false;

    await user.save();

    return res.status(200).send({
      message: "User archived successfully.",
      user
    });
  } catch (err) {
    console.error("Archive user error:", err);
    return res.status(500).send({
      error: "Failed to archive user."
    });
  }
};


// Get specific user by ID (Admin only)
module.exports.getSpecificUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({
        error: "Invalid user ID"
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).send({
        error: "User not found"
      });
    }

    return res.status(200).send({
      user
    });
  } catch (error) {
    console.error("Get specific user error:", error);
    return res.status(500).send({
      error: "Failed to fetch user"
    });
  }
};


// Activate user (Admin only)
module.exports.activateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({
        error: "Invalid user ID."
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    user.isArchived = false;
    user.isActive = true;
    user.accountStatus = "active";

    await user.save();

    return res.status(200).send({
      message: "User activated successfully.",
      user
    });
  } catch (err) {
    console.error("Activate user error:", err);
    return res.status(500).send({
      error: "Failed to activate user."
    });
  }
};

// Delete user (Admin only)
module.exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).send({
        error: "Invalid user ID."
      });
    }

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    return res.status(200).send({
      message: "User deleted successfully."
    });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).send({
      error: "Failed to delete user."
    });
  }
};

// Upload User Photo
module.exports.uploadUserPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({
        error: "No image file uploaded."
      });
    }

    const userId = req.user.id;

    const uploadFromBuffer = (fileBuffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "bildex/users",
            resource_type: "image"
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        streamifier.createReadStream(fileBuffer).pipe(stream);
      });

    const result = await uploadFromBuffer(req.file.buffer);

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePhoto: result.secure_url },
      { new: true }
    );

    return res.status(200).send({
      message: "Profile photo uploaded successfully.",
      imageUrl: result.secure_url,
      user
    });
  } catch (err) {
    console.error("Upload user photo error:", err);
    return res.status(500).send({
      error: "Failed to upload profile photo."
    });
  }
};


// Forgot Password
module.exports.forgotPasswordUser = async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Forgot password request email:", email);

    if (!email) {
      return res.status(400).send({
        error: "Email is required."
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    console.log("User found:", user ? user.email : "No user found");

    if (!user) {
      return res.status(404).send({
        error: "No user found with that email."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetLink = `${process.env.CLIENT_URL}/reset-password-user/${resetToken}`;

    console.log("Generated reset link:", resetLink);

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 1000 * 60 * 15;

    await user.save();

    return res.status(200).send({
      message: "Quick test successful. Reset link generated.",
      resetLink
    });
  } catch (error) {
    console.error("Forgot password user error:", error);
    return res.status(500).send({
      error: error.message || "Failed to process request."
    });
  }
};


module.exports.resetPasswordUser = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      return res.status(400).send({
        error: "Password and confirm password are required."
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).send({
        error: "Passwords do not match."
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).send({
        error: "Invalid or expired reset token."
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetToken = "";
    user.passwordResetExpires = null;

    await user.save();

    return res.status(200).send({
      message: "Password reset successful."
    });
  } catch (error) {
    console.error("Reset password user error:", error);
    return res.status(500).send({
      error: error.message || "Failed to reset password."
    });
  }
};