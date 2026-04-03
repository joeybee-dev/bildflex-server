const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const crypto = require("crypto");
const mongoose = require("mongoose");
const auth = require("../middlewares/auth");
const sendEmail = require("../utils/sendEmail");

// Register user
module.exports.registerUser = async (req, res) => {
  try {
    const {
      profilePhoto,
      firstName,
      lastName,
      gender,
      birthYear,
      email,
      mobileNumber,
      city,
      province,
      country,
      aboutMe,
      password
    } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return res.status(400).send({ error: "Email is required." });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).send({ error: "Email already registered." });
    }

    const newUser = new User({
      profilePhoto,
      firstName,
      lastName,
      gender,
      birthYear,
      email: normalizedEmail,
      mobileNumber,
      city,
      province,
      country,
      aboutMe,
      password
    });

    const savedUser = await newUser.save();

    return res.status(201).send({
      message: "User registered successfully.",
      user: {
        _id: savedUser._id,
        profilePhoto: savedUser.profilePhoto,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        userType: savedUser.userType,
        accountStatus: savedUser.accountStatus,
        subscriptionPlan: savedUser.subscriptionPlan
      }
    });
  } catch (error) {
    console.error("Register user error:", error);
    return res.status(500).send({
      error: error.message || "Failed to register user."
    });
  }
};

// Login user
module.exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).send({ error: "Incorrect email or password." });
    }

    if (user.accountStatus !== "active") {
      return res.status(403).send({
        error: `Account is ${user.accountStatus}.`
      });
    }

    const accessToken = auth.createAccessToken(user);

    return res.status(200).send({
      access: accessToken,
      user: {
        _id: user._id,
        profilePhoto: user.profilePhoto,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        userType: user.userType,
        accountStatus: user.accountStatus,
        subscriptionPlan: user.subscriptionPlan
      }
    });
  } catch (error) {
    console.error("Login user error:", error);
    return res.status(500).send({
      error: error.message || "Failed to login user."
    });
  }
};

// Get logged-in user details
module.exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send({ user });
  } catch (error) {
    console.error("Get user details error:", error);
    return res.status(500).send({
      error: error.message || "Failed to get user details."
    });
  }
};

// Update profile
module.exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    const {
      profilePhoto,
      firstName,
      lastName,
      gender,
      birthYear,
      mobileNumber,
      city,
      province,
      country,
      aboutMe
    } = req.body;

    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (firstName !== undefined) user.firstName = firstName.trim();
    if (lastName !== undefined) user.lastName = lastName.trim();
    if (gender !== undefined) user.gender = gender;
    if (birthYear !== undefined) user.birthYear = birthYear;
    if (mobileNumber !== undefined) user.mobileNumber = mobileNumber.trim();
    if (city !== undefined) user.city = city.trim();
    if (province !== undefined) user.province = province.trim();
    if (country !== undefined) user.country = country.trim();
    if (aboutMe !== undefined) user.aboutMe = aboutMe.trim();

    const updatedUser = await user.save();

    return res.status(200).send({
      message: "Profile updated successfully.",
      user: {
        _id: updatedUser._id,
        profilePhoto: updatedUser.profilePhoto,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        gender: updatedUser.gender,
        birthYear: updatedUser.birthYear,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobileNumber,
        city: updatedUser.city,
        province: updatedUser.province,
        country: updatedUser.country,
        aboutMe: updatedUser.aboutMe,
        userType: updatedUser.userType,
        accountStatus: updatedUser.accountStatus,
        isFeatured: updatedUser.isFeatured,
        subscriptionPlan: updatedUser.subscriptionPlan,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update profile."
    });
  }
};

// Update photo
module.exports.updatePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send({ error: "No image file uploaded." });
    }

    const uploadFromBuffer = (fileBuffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "bildflex/users",
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
      req.user.id,
      { profilePhoto: result.secure_url },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send({
      message: "Profile photo uploaded successfully.",
      imageUrl: result.secure_url,
      user
    });
  } catch (error) {
    console.error("Update photo error:", error);
    return res.status(500).send({
      error: error.message || "Failed to upload profile photo."
    });
  }
};

// Change password
module.exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).send({
        error: "Current password, new password, and confirm password are required."
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).send({
        error: "New passwords do not match."
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).send({ error: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).send({
      message: "Password changed successfully."
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).send({
      error: error.message || "Failed to change password."
    });
  }
};

// Deactivate own account
module.exports.deactivateOwnAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { accountStatus: "archived" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send({
      message: "Account deactivated successfully.",
      user
    });
  } catch (error) {
    console.error("Deactivate own account error:", error);
    return res.status(500).send({
      error: error.message || "Failed to deactivate account."
    });
  }
};

// Forgot password
module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).send({ error: "Email is required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).send({
        message: "If an account with that email exists, a reset link has been generated."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 1000 * 60 * 15;

    await user.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Uncomment when sendEmail is ready
    // await sendEmail({
    //   to: user.email,
    //   subject: "Reset Your Password",
    //   html: `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    // });

    return res.status(200).send({
      message: "Password reset link generated successfully.",
      resetLink
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).send({
      error: error.message || "Failed to process forgot password request."
    });
  }
};

// Reset password
module.exports.resetPassword = async (req, res) => {
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

    user.password = password;
    user.passwordResetToken = "";
    user.passwordResetExpires = null;

    await user.save();

    return res.status(200).send({
      message: "Password reset successful."
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).send({
      error: error.message || "Failed to reset password."
    });
  }
};

// Get all users (Admin only)
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).send({ users });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch users."
    });
  }
};

// Get user by ID (Admin only)
module.exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid user ID." });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send({ user });
  } catch (error) {
    console.error("Get user by ID error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch user."
    });
  }
};

// Update account status (Admin only)
module.exports.updateAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid user ID." });
    }

    const allowedStatuses = ["active", "suspended", "archived", "pending"];

    if (!allowedStatuses.includes(accountStatus)) {
      return res.status(400).send({ error: "Invalid account status." });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { accountStatus },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send({
      message: "Account status updated successfully.",
      user
    });
  } catch (error) {
    console.error("Update account status error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update account status."
    });
  }
};

// Update subscription plan (Admin only)
module.exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptionPlan } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid user ID." });
    }

    const allowedPlans = ["basic", "standard", "premium"];

    if (!allowedPlans.includes(subscriptionPlan)) {
      return res.status(400).send({ error: "Invalid subscription plan." });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { subscriptionPlan },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send({
      message: "Subscription plan updated successfully.",
      user
    });
  } catch (error) {
    console.error("Update subscription plan error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update subscription plan."
    });
  }
};

// Update featured status (Admin only)
module.exports.updateFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid user ID." });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isFeatured: !!isFeatured },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send({
      message: "Featured status updated successfully.",
      user
    });
  } catch (error) {
    console.error("Update featured status error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update featured status."
    });
  }
};

// Update user type (Admin only)
module.exports.updateUserType = async (req, res) => {
  try {
    const { id } = req.params;
    const { userType } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid user ID." });
    }

    const allowedTypes = ["user", "admin"];

    if (!allowedTypes.includes(userType)) {
      return res.status(400).send({ error: "Invalid user type." });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { userType },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send({
      message: "User type updated successfully.",
      user
    });
  } catch (error) {
    console.error("Update user type error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update user type."
    });
  }
};

// Archive user (Admin only)
module.exports.archiveUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid user ID." });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { accountStatus: "archived" },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send({
      message: "User archived successfully.",
      user
    });
  } catch (error) {
    console.error("Archive user error:", error);
    return res.status(500).send({
      error: error.message || "Failed to archive user."
    });
  }
};

// Delete user (Admin only)
module.exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid user ID." });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).send({ error: "User not found." });
    }

    return res.status(200).send({
      message: "User deleted successfully."
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).send({
      error: error.message || "Failed to delete user."
    });
  }
};