const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const Handyman = require("../models/Handyman");
const crypto = require("crypto");
const mongoose = require("mongoose");
const auth = require("../middlewares/auth");
const sendEmail = require("../utils/sendEmail");

// Register handyman
module.exports.registerHandyman = async (req, res) => {
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
      skills,
      servicesOffered,
      yearsExperience,
      serviceAreas,
      availabilityStatus,
      portfolioImages,
      password
    } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail) {
      return res.status(400).send({ error: "Email is required." });
    }

    const existingHandyman = await Handyman.findOne({ email: normalizedEmail });

    if (existingHandyman) {
      return res.status(409).send({ error: "Email already registered." });
    }

    const newHandyman = new Handyman({
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
      skills,
      servicesOffered,
      yearsExperience,
      serviceAreas,
      availabilityStatus,
      portfolioImages,
      password
    });

    const savedHandyman = await newHandyman.save();

    return res.status(201).send({
      message: "Handyman registered successfully.",
      handyman: {
        _id: savedHandyman._id,
        profilePhoto: savedHandyman.profilePhoto,
        firstName: savedHandyman.firstName,
        lastName: savedHandyman.lastName,
        email: savedHandyman.email,
        userType: savedHandyman.userType,
        accountStatus: savedHandyman.accountStatus,
        subscriptionPlan: savedHandyman.subscriptionPlan
      }
    });
  } catch (error) {
    console.error("Register handyman error:", error);
    return res.status(500).send({
      error: error.message || "Failed to register handyman."
    });
  }
};

// Login handyman
module.exports.loginHandyman = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();
    const handyman = await Handyman.findOne({ email: normalizedEmail });

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    const isPasswordCorrect = await handyman.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).send({ error: "Incorrect email or password." });
    }

    if (handyman.accountStatus !== "active") {
      return res.status(403).send({
        error: `Account is ${handyman.accountStatus}.`
      });
    }

    const accessToken = auth.createAccessToken(handyman);

    return res.status(200).send({
      access: accessToken,
      handyman: {
        _id: handyman._id,
        profilePhoto: handyman.profilePhoto,
        firstName: handyman.firstName,
        lastName: handyman.lastName,
        email: handyman.email,
        userType: handyman.userType,
        accountStatus: handyman.accountStatus,
        subscriptionPlan: handyman.subscriptionPlan
      }
    });
  } catch (error) {
    console.error("Login handyman error:", error);
    return res.status(500).send({
      error: error.message || "Failed to login handyman."
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
    const handyman = await Handyman.findOne({ email: normalizedEmail });

    if (!handyman) {
      return res.status(200).send({
        message: "If an account with that email exists, a reset link has been generated."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    handyman.passwordResetToken = resetToken;
    handyman.passwordResetExpires = Date.now() + 1000 * 60 * 15;

    await handyman.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password-handyman/${resetToken}`;

    // Uncomment when sendEmail is ready
    // await sendEmail({
    //   to: handyman.email,
    //   subject: "Reset Your Password",
    //   html: `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    // });

    return res.status(200).send({
      message: "Password reset link generated successfully.",
      resetLink
    });
  } catch (error) {
    console.error("Forgot password handyman error:", error);
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

    const handyman = await Handyman.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!handyman) {
      return res.status(400).send({
        error: "Invalid or expired reset token."
      });
    }

    handyman.password = password;
    handyman.passwordResetToken = "";
    handyman.passwordResetExpires = null;

    await handyman.save();

    return res.status(200).send({
      message: "Password reset successful."
    });
  } catch (error) {
    console.error("Reset password handyman error:", error);
    return res.status(500).send({
      error: error.message || "Failed to reset password."
    });
  }
};

// Public: get active handymen
module.exports.getActiveHandymen = async (req, res) => {
  try {
    const handymen = await Handyman.find({ accountStatus: "active" })
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ isFeatured: -1, createdAt: -1 });

    return res.status(200).send({ handymen });
  } catch (error) {
    console.error("Get active handymen error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch active handymen."
    });
  }
};

// Public: get featured handymen
module.exports.getFeaturedHandymen = async (req, res) => {
  try {
    const handymen = await Handyman.find({
      isFeatured: true,
      accountStatus: "active"
    })
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).send({ handymen });
  } catch (error) {
    console.error("Get featured handymen error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch featured handymen."
    });
  }
};

// Public: get one handyman profile
module.exports.getHandymanPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid handyman ID." });
    }

    const handyman = await Handyman.findOne({
      _id: id,
      accountStatus: "active"
    }).select("-password -passwordResetToken -passwordResetExpires");

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    return res.status(200).send({ handyman });
  } catch (error) {
    console.error("Get handyman public profile error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch handyman profile."
    });
  }
};

// Get logged-in handyman details
module.exports.getHandymanDetails = async (req, res) => {
  try {
    const handyman = await Handyman.findById(req.user.id).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    return res.status(200).send({ handyman });
  } catch (error) {
    console.error("Get handyman details error:", error);
    return res.status(500).send({
      error: error.message || "Failed to get handyman details."
    });
  }
};

// Update profile
module.exports.updateProfile = async (req, res) => {
  try {
    const handyman = await Handyman.findById(req.user.id);

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
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
      aboutMe,
      skills,
      servicesOffered,
      yearsExperience,
      serviceAreas,
      availabilityStatus,
      portfolioImages
    } = req.body;

    if (profilePhoto !== undefined) handyman.profilePhoto = profilePhoto;
    if (firstName !== undefined) handyman.firstName = firstName.trim();
    if (lastName !== undefined) handyman.lastName = lastName.trim();
    if (gender !== undefined) handyman.gender = gender;
    if (birthYear !== undefined) handyman.birthYear = birthYear;
    if (mobileNumber !== undefined) handyman.mobileNumber = mobileNumber.trim();
    if (city !== undefined) handyman.city = city.trim();
    if (province !== undefined) handyman.province = province.trim();
    if (country !== undefined) handyman.country = country.trim();
    if (aboutMe !== undefined) handyman.aboutMe = aboutMe.trim();
    if (skills !== undefined) handyman.skills = skills;
    if (servicesOffered !== undefined) handyman.servicesOffered = servicesOffered;
    if (yearsExperience !== undefined) handyman.yearsExperience = yearsExperience;
    if (serviceAreas !== undefined) handyman.serviceAreas = serviceAreas;
    if (availabilityStatus !== undefined) handyman.availabilityStatus = availabilityStatus;
    if (portfolioImages !== undefined) handyman.portfolioImages = portfolioImages;

    const updatedHandyman = await handyman.save();

    return res.status(200).send({
      message: "Profile updated successfully.",
      handyman: {
        _id: updatedHandyman._id,
        profilePhoto: updatedHandyman.profilePhoto,
        firstName: updatedHandyman.firstName,
        lastName: updatedHandyman.lastName,
        gender: updatedHandyman.gender,
        birthYear: updatedHandyman.birthYear,
        email: updatedHandyman.email,
        mobileNumber: updatedHandyman.mobileNumber,
        city: updatedHandyman.city,
        province: updatedHandyman.province,
        country: updatedHandyman.country,
        aboutMe: updatedHandyman.aboutMe,
        skills: updatedHandyman.skills,
        servicesOffered: updatedHandyman.servicesOffered,
        yearsExperience: updatedHandyman.yearsExperience,
        serviceAreas: updatedHandyman.serviceAreas,
        availabilityStatus: updatedHandyman.availabilityStatus,
        portfolioImages: updatedHandyman.portfolioImages,
        averageRating: updatedHandyman.averageRating,
        totalReviews: updatedHandyman.totalReviews,
        userType: updatedHandyman.userType,
        accountStatus: updatedHandyman.accountStatus,
        isFeatured: updatedHandyman.isFeatured,
        subscriptionPlan: updatedHandyman.subscriptionPlan,
        createdAt: updatedHandyman.createdAt,
        updatedAt: updatedHandyman.updatedAt
      }
    });
  } catch (error) {
    console.error("Update handyman profile error:", error);
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
            folder: "bildflex/handymen",
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

    const handyman = await Handyman.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: result.secure_url },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    return res.status(200).send({
      message: "Profile photo uploaded successfully.",
      imageUrl: result.secure_url,
      handyman
    });
  } catch (error) {
    console.error("Update handyman photo error:", error);
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

    const handyman = await Handyman.findById(req.user.id);

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    const isPasswordCorrect = await handyman.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).send({ error: "Current password is incorrect." });
    }

    handyman.password = newPassword;
    await handyman.save();

    return res.status(200).send({
      message: "Password changed successfully."
    });
  } catch (error) {
    console.error("Change handyman password error:", error);
    return res.status(500).send({
      error: error.message || "Failed to change password."
    });
  }
};

// Deactivate own account
module.exports.deactivateOwnAccount = async (req, res) => {
  try {
    const handyman = await Handyman.findByIdAndUpdate(
      req.user.id,
      { accountStatus: "archived" },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    return res.status(200).send({
      message: "Account deactivated successfully.",
      handyman
    });
  } catch (error) {
    console.error("Deactivate handyman account error:", error);
    return res.status(500).send({
      error: error.message || "Failed to deactivate account."
    });
  }
};

// Admin: get all handymen
module.exports.getAllHandymen = async (req, res) => {
  try {
    const handymen = await Handyman.find()
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).send({ handymen });
  } catch (error) {
    console.error("Get all handymen error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch handymen."
    });
  }
};

// Admin: get handyman by ID
module.exports.getHandymanByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid handyman ID." });
    }

    const handyman = await Handyman.findById(id).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    return res.status(200).send({ handyman });
  } catch (error) {
    console.error("Get handyman by ID admin error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch handyman."
    });
  }
};

// Admin: update account status
module.exports.updateAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid handyman ID." });
    }

    const allowedStatuses = ["active", "suspended", "archived", "pending"];

    if (!allowedStatuses.includes(accountStatus)) {
      return res.status(400).send({ error: "Invalid account status." });
    }

    const handyman = await Handyman.findByIdAndUpdate(
      id,
      { accountStatus },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    return res.status(200).send({
      message: "Account status updated successfully.",
      handyman
    });
  } catch (error) {
    console.error("Update handyman account status error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update account status."
    });
  }
};

// Admin: update subscription plan
module.exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptionPlan } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid handyman ID." });
    }

    const allowedPlans = ["basic", "standard", "premium"];

    if (!allowedPlans.includes(subscriptionPlan)) {
      return res.status(400).send({ error: "Invalid subscription plan." });
    }

    const handyman = await Handyman.findByIdAndUpdate(
      id,
      { subscriptionPlan },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    return res.status(200).send({
      message: "Subscription plan updated successfully.",
      handyman
    });
  } catch (error) {
    console.error("Update handyman subscription plan error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update subscription plan."
    });
  }
};

// Admin: update featured status
module.exports.updateFeaturedStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid handyman ID." });
    }

    const handyman = await Handyman.findByIdAndUpdate(
      id,
      { isFeatured: !!isFeatured },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    return res.status(200).send({
      message: "Featured status updated successfully.",
      handyman
    });
  } catch (error) {
    console.error("Update handyman featured status error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update featured status."
    });
  }
};

// Admin: archive handyman
module.exports.archiveHandyman = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid handyman ID." });
    }

    const handyman = await Handyman.findByIdAndUpdate(
      id,
      { accountStatus: "archived" },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!handyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    return res.status(200).send({
      message: "Handyman archived successfully.",
      handyman
    });
  } catch (error) {
    console.error("Archive handyman error:", error);
    return res.status(500).send({
      error: error.message || "Failed to archive handyman."
    });
  }
};

// Admin: delete handyman
module.exports.deleteHandyman = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid handyman ID." });
    }

    const deletedHandyman = await Handyman.findByIdAndDelete(id);

    if (!deletedHandyman) {
      return res.status(404).send({ error: "Handyman not found." });
    }

    return res.status(200).send({
      message: "Handyman deleted successfully."
    });
  } catch (error) {
    console.error("Delete handyman error:", error);
    return res.status(500).send({
      error: error.message || "Failed to delete handyman."
    });
  }
};