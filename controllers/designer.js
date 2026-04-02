const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const Designer = require("../models/Designer");
const crypto = require("crypto");
const mongoose = require("mongoose");
const auth = require("../middlewares/auth");
const sendEmail = require("../utils/sendEmail");

// Register designer
module.exports.registerDesigner = async (req, res) => {
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
      designSpecializations,
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

    const existingDesigner = await Designer.findOne({ email: normalizedEmail });

    if (existingDesigner) {
      return res.status(409).send({ error: "Email already registered." });
    }

    const newDesigner = new Designer({
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
      designSpecializations,
      servicesOffered,
      yearsExperience,
      serviceAreas,
      availabilityStatus,
      portfolioImages,
      password
    });

    const savedDesigner = await newDesigner.save();

    return res.status(201).send({
      message: "Designer registered successfully.",
      designer: {
        _id: savedDesigner._id,
        profilePhoto: savedDesigner.profilePhoto,
        firstName: savedDesigner.firstName,
        lastName: savedDesigner.lastName,
        email: savedDesigner.email,
        userType: savedDesigner.userType,
        accountStatus: savedDesigner.accountStatus,
        subscriptionPlan: savedDesigner.subscriptionPlan
      }
    });
  } catch (error) {
    console.error("Register designer error:", error);
    return res.status(500).send({
      error: error.message || "Failed to register designer."
    });
  }
};

// Login designer
module.exports.loginDesigner = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();
    const designer = await Designer.findOne({ email: normalizedEmail });

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
    }

    const isPasswordCorrect = await designer.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).send({ error: "Incorrect email or password." });
    }

    if (designer.accountStatus !== "active") {
      return res.status(403).send({
        error: `Account is ${designer.accountStatus}.`
      });
    }

    const accessToken = auth.createAccessToken(designer);

    return res.status(200).send({
      access: accessToken,
      designer: {
        _id: designer._id,
        profilePhoto: designer.profilePhoto,
        firstName: designer.firstName,
        lastName: designer.lastName,
        email: designer.email,
        userType: designer.userType,
        accountStatus: designer.accountStatus,
        subscriptionPlan: designer.subscriptionPlan
      }
    });
  } catch (error) {
    console.error("Login designer error:", error);
    return res.status(500).send({
      error: error.message || "Failed to login designer."
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
    const designer = await Designer.findOne({ email: normalizedEmail });

    if (!designer) {
      return res.status(200).send({
        message: "If an account with that email exists, a reset link has been generated."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    designer.passwordResetToken = resetToken;
    designer.passwordResetExpires = Date.now() + 1000 * 60 * 15;

    await designer.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password-designer/${resetToken}`;

    // Uncomment when sendEmail is ready
    // await sendEmail({
    //   to: designer.email,
    //   subject: "Reset Your Password",
    //   html: `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    // });

    return res.status(200).send({
      message: "Password reset link generated successfully.",
      resetLink
    });
  } catch (error) {
    console.error("Forgot password designer error:", error);
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

    const designer = await Designer.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!designer) {
      return res.status(400).send({
        error: "Invalid or expired reset token."
      });
    }

    designer.password = password;
    designer.passwordResetToken = "";
    designer.passwordResetExpires = null;

    await designer.save();

    return res.status(200).send({
      message: "Password reset successful."
    });
  } catch (error) {
    console.error("Reset password designer error:", error);
    return res.status(500).send({
      error: error.message || "Failed to reset password."
    });
  }
};

// Public: get active designers
module.exports.getActiveDesigners = async (req, res) => {
  try {
    const designers = await Designer.find({ accountStatus: "active" })
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ isFeatured: -1, createdAt: -1 });

    return res.status(200).send({ designers });
  } catch (error) {
    console.error("Get active designers error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch active designers."
    });
  }
};

// Public: get featured designers
module.exports.getFeaturedDesigners = async (req, res) => {
  try {
    const designers = await Designer.find({
      isFeatured: true,
      accountStatus: "active"
    })
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).send({ designers });
  } catch (error) {
    console.error("Get featured designers error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch featured designers."
    });
  }
};

// Public: get one designer profile
module.exports.getDesignerPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid designer ID." });
    }

    const designer = await Designer.findOne({
      _id: id,
      accountStatus: "active"
    }).select("-password -passwordResetToken -passwordResetExpires");

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
    }

    return res.status(200).send({ designer });
  } catch (error) {
    console.error("Get designer public profile error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch designer profile."
    });
  }
};

// Get logged-in designer details
module.exports.getDesignerDetails = async (req, res) => {
  try {
    const designer = await Designer.findById(req.user.id).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
    }

    return res.status(200).send({ designer });
  } catch (error) {
    console.error("Get designer details error:", error);
    return res.status(500).send({
      error: error.message || "Failed to get designer details."
    });
  }
};

// Update profile
module.exports.updateProfile = async (req, res) => {
  try {
    const designer = await Designer.findById(req.user.id);

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
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
      designSpecializations,
      servicesOffered,
      yearsExperience,
      serviceAreas,
      availabilityStatus,
      portfolioImages
    } = req.body;

    if (profilePhoto !== undefined) designer.profilePhoto = profilePhoto;
    if (firstName !== undefined) designer.firstName = firstName.trim();
    if (lastName !== undefined) designer.lastName = lastName.trim();
    if (gender !== undefined) designer.gender = gender;
    if (birthYear !== undefined) designer.birthYear = birthYear;
    if (mobileNumber !== undefined) designer.mobileNumber = mobileNumber.trim();
    if (city !== undefined) designer.city = city.trim();
    if (province !== undefined) designer.province = province.trim();
    if (country !== undefined) designer.country = country.trim();
    if (aboutMe !== undefined) designer.aboutMe = aboutMe.trim();
    if (designSpecializations !== undefined) designer.designSpecializations = designSpecializations;
    if (servicesOffered !== undefined) designer.servicesOffered = servicesOffered;
    if (yearsExperience !== undefined) designer.yearsExperience = yearsExperience;
    if (serviceAreas !== undefined) designer.serviceAreas = serviceAreas;
    if (availabilityStatus !== undefined) designer.availabilityStatus = availabilityStatus;
    if (portfolioImages !== undefined) designer.portfolioImages = portfolioImages;

    const updatedDesigner = await designer.save();

    return res.status(200).send({
      message: "Profile updated successfully.",
      designer: {
        _id: updatedDesigner._id,
        profilePhoto: updatedDesigner.profilePhoto,
        firstName: updatedDesigner.firstName,
        lastName: updatedDesigner.lastName,
        gender: updatedDesigner.gender,
        birthYear: updatedDesigner.birthYear,
        email: updatedDesigner.email,
        mobileNumber: updatedDesigner.mobileNumber,
        city: updatedDesigner.city,
        province: updatedDesigner.province,
        country: updatedDesigner.country,
        aboutMe: updatedDesigner.aboutMe,
        designSpecializations: updatedDesigner.designSpecializations,
        servicesOffered: updatedDesigner.servicesOffered,
        yearsExperience: updatedDesigner.yearsExperience,
        serviceAreas: updatedDesigner.serviceAreas,
        availabilityStatus: updatedDesigner.availabilityStatus,
        portfolioImages: updatedDesigner.portfolioImages,
        averageRating: updatedDesigner.averageRating,
        totalReviews: updatedDesigner.totalReviews,
        userType: updatedDesigner.userType,
        accountStatus: updatedDesigner.accountStatus,
        isFeatured: updatedDesigner.isFeatured,
        subscriptionPlan: updatedDesigner.subscriptionPlan,
        createdAt: updatedDesigner.createdAt,
        updatedAt: updatedDesigner.updatedAt
      }
    });
  } catch (error) {
    console.error("Update designer profile error:", error);
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
            folder: "bildflex/designers",
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

    const designer = await Designer.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: result.secure_url },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
    }

    return res.status(200).send({
      message: "Profile photo uploaded successfully.",
      imageUrl: result.secure_url,
      designer
    });
  } catch (error) {
    console.error("Update designer photo error:", error);
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

    const designer = await Designer.findById(req.user.id);

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
    }

    const isPasswordCorrect = await designer.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).send({ error: "Current password is incorrect." });
    }

    designer.password = newPassword;
    await designer.save();

    return res.status(200).send({
      message: "Password changed successfully."
    });
  } catch (error) {
    console.error("Change designer password error:", error);
    return res.status(500).send({
      error: error.message || "Failed to change password."
    });
  }
};

// Deactivate own account
module.exports.deactivateOwnAccount = async (req, res) => {
  try {
    const designer = await Designer.findByIdAndUpdate(
      req.user.id,
      { accountStatus: "archived" },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
    }

    return res.status(200).send({
      message: "Account deactivated successfully.",
      designer
    });
  } catch (error) {
    console.error("Deactivate designer account error:", error);
    return res.status(500).send({
      error: error.message || "Failed to deactivate account."
    });
  }
};

// Admin: get all designers
module.exports.getAllDesigners = async (req, res) => {
  try {
    const designers = await Designer.find()
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).send({ designers });
  } catch (error) {
    console.error("Get all designers error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch designers."
    });
  }
};

// Admin: get designer by ID
module.exports.getDesignerByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid designer ID." });
    }

    const designer = await Designer.findById(id).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
    }

    return res.status(200).send({ designer });
  } catch (error) {
    console.error("Get designer by ID admin error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch designer."
    });
  }
};

// Admin: update account status
module.exports.updateAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid designer ID." });
    }

    const allowedStatuses = ["active", "suspended", "archived", "pending"];

    if (!allowedStatuses.includes(accountStatus)) {
      return res.status(400).send({ error: "Invalid account status." });
    }

    const designer = await Designer.findByIdAndUpdate(
      id,
      { accountStatus },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
    }

    return res.status(200).send({
      message: "Account status updated successfully.",
      designer
    });
  } catch (error) {
    console.error("Update designer account status error:", error);
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
      return res.status(400).send({ error: "Invalid designer ID." });
    }

    const allowedPlans = ["basic", "standard", "premium"];

    if (!allowedPlans.includes(subscriptionPlan)) {
      return res.status(400).send({ error: "Invalid subscription plan." });
    }

    const designer = await Designer.findByIdAndUpdate(
      id,
      { subscriptionPlan },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
    }

    return res.status(200).send({
      message: "Subscription plan updated successfully.",
      designer
    });
  } catch (error) {
    console.error("Update designer subscription plan error:", error);
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
      return res.status(400).send({ error: "Invalid designer ID." });
    }

    const designer = await Designer.findByIdAndUpdate(
      id,
      { isFeatured: !!isFeatured },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
    }

    return res.status(200).send({
      message: "Featured status updated successfully.",
      designer
    });
  } catch (error) {
    console.error("Update designer featured status error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update featured status."
    });
  }
};

// Admin: archive designer
module.exports.archiveDesigner = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid designer ID." });
    }

    const designer = await Designer.findByIdAndUpdate(
      id,
      { accountStatus: "archived" },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!designer) {
      return res.status(404).send({ error: "Designer not found." });
    }

    return res.status(200).send({
      message: "Designer archived successfully.",
      designer
    });
  } catch (error) {
    console.error("Archive designer error:", error);
    return res.status(500).send({
      error: error.message || "Failed to archive designer."
    });
  }
};

// Admin: delete designer
module.exports.deleteDesigner = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid designer ID." });
    }

    const deletedDesigner = await Designer.findByIdAndDelete(id);

    if (!deletedDesigner) {
      return res.status(404).send({ error: "Designer not found." });
    }

    return res.status(200).send({
      message: "Designer deleted successfully."
    });
  } catch (error) {
    console.error("Delete designer error:", error);
    return res.status(500).send({
      error: error.message || "Failed to delete designer."
    });
  }
};