const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const Contractor = require("../models/Contractor");
const crypto = require("crypto");
const mongoose = require("mongoose");
const auth = require("../middlewares/auth");
const sendEmail = require("../utils/sendEmail");

// Register contractor
module.exports.registerContractor = async (req, res) => {
  try {
    const {
      profilePhoto,
      businessName,
      contactPersonFirstName,
      contactPersonLastName,
      gender,
      birthYear,
      email,
      mobileNumber,
      city,
      province,
      country,
      aboutUs,
      contractorSpecializations,
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

    const existingContractor = await Contractor.findOne({ email: normalizedEmail });

    if (existingContractor) {
      return res.status(409).send({ error: "Email already registered." });
    }

    const newContractor = new Contractor({
      profilePhoto,
      businessName,
      contactPersonFirstName,
      contactPersonLastName,
      gender,
      birthYear,
      email: normalizedEmail,
      mobileNumber,
      city,
      province,
      country,
      aboutUs,
      contractorSpecializations,
      servicesOffered,
      yearsExperience,
      serviceAreas,
      availabilityStatus,
      portfolioImages,
      password
    });

    const savedContractor = await newContractor.save();

    return res.status(201).send({
      message: "Contractor registered successfully.",
      contractor: {
        _id: savedContractor._id,
        profilePhoto: savedContractor.profilePhoto,
        businessName: savedContractor.businessName,
        contactPersonFirstName: savedContractor.contactPersonFirstName,
        contactPersonLastName: savedContractor.contactPersonLastName,
        email: savedContractor.email,
        userType: savedContractor.userType,
        accountStatus: savedContractor.accountStatus,
        subscriptionPlan: savedContractor.subscriptionPlan
      }
    });
  } catch (error) {
    console.error("Register contractor error:", error);
    return res.status(500).send({
      error: error.message || "Failed to register contractor."
    });
  }
};

// Login contractor
module.exports.loginContractor = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();
    const contractor = await Contractor.findOne({ email: normalizedEmail });

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    const isPasswordCorrect = await contractor.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).send({ error: "Incorrect email or password." });
    }

    if (contractor.accountStatus !== "active") {
      return res.status(403).send({
        error: `Account is ${contractor.accountStatus}.`
      });
    }

    const accessToken = auth.createAccessToken(contractor);

    return res.status(200).send({
      access: accessToken,
      contractor: {
        _id: contractor._id,
        profilePhoto: contractor.profilePhoto,
        businessName: contractor.businessName,
        contactPersonFirstName: contractor.contactPersonFirstName,
        contactPersonLastName: contractor.contactPersonLastName,
        email: contractor.email,
        userType: contractor.userType,
        accountStatus: contractor.accountStatus,
        subscriptionPlan: contractor.subscriptionPlan
      }
    });
  } catch (error) {
    console.error("Login contractor error:", error);
    return res.status(500).send({
      error: error.message || "Failed to login contractor."
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
    const contractor = await Contractor.findOne({ email: normalizedEmail });

    if (!contractor) {
      return res.status(200).send({
        message: "If an account with that email exists, a reset link has been generated."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    contractor.passwordResetToken = resetToken;
    contractor.passwordResetExpires = Date.now() + 1000 * 60 * 15;

    await contractor.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password-contractor/${resetToken}`;

    // Uncomment when sendEmail is ready
    // await sendEmail({
    //   to: contractor.email,
    //   subject: "Reset Your Password",
    //   html: `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    // });

    return res.status(200).send({
      message: "Password reset link generated successfully.",
      resetLink
    });
  } catch (error) {
    console.error("Forgot password contractor error:", error);
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

    const contractor = await Contractor.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!contractor) {
      return res.status(400).send({
        error: "Invalid or expired reset token."
      });
    }

    contractor.password = password;
    contractor.passwordResetToken = "";
    contractor.passwordResetExpires = null;

    await contractor.save();

    return res.status(200).send({
      message: "Password reset successful."
    });
  } catch (error) {
    console.error("Reset password contractor error:", error);
    return res.status(500).send({
      error: error.message || "Failed to reset password."
    });
  }
};

// Public: get active contractors
module.exports.getActiveContractors = async (req, res) => {
  try {
    const contractors = await Contractor.find({ accountStatus: "active" })
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ isFeatured: -1, createdAt: -1 });

    return res.status(200).send({ contractors });
  } catch (error) {
    console.error("Get active contractors error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch active contractors."
    });
  }
};

// Public: get featured contractors
module.exports.getFeaturedContractors = async (req, res) => {
  try {
    const contractors = await Contractor.find({
      isFeatured: true,
      accountStatus: "active"
    })
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).send({ contractors });
  } catch (error) {
    console.error("Get featured contractors error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch featured contractors."
    });
  }
};

// Public: get one contractor profile
module.exports.getContractorPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid contractor ID." });
    }

    const contractor = await Contractor.findOne({
      _id: id,
      accountStatus: "active"
    }).select("-password -passwordResetToken -passwordResetExpires");

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    return res.status(200).send({ contractor });
  } catch (error) {
    console.error("Get contractor public profile error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch contractor profile."
    });
  }
};

// Get logged-in contractor details
module.exports.getContractorDetails = async (req, res) => {
  try {
    const contractor = await Contractor.findById(req.user.id).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    return res.status(200).send({ contractor });
  } catch (error) {
    console.error("Get contractor details error:", error);
    return res.status(500).send({
      error: error.message || "Failed to get contractor details."
    });
  }
};

// Update profile
module.exports.updateProfile = async (req, res) => {
  try {
    const contractor = await Contractor.findById(req.user.id);

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    const {
      profilePhoto,
      businessName,
      contactPersonFirstName,
      contactPersonLastName,
      gender,
      birthYear,
      mobileNumber,
      city,
      province,
      country,
      aboutUs,
      contractorSpecializations,
      servicesOffered,
      yearsExperience,
      serviceAreas,
      availabilityStatus,
      portfolioImages
    } = req.body;

    if (profilePhoto !== undefined) contractor.profilePhoto = profilePhoto;
    if (businessName !== undefined) contractor.businessName = businessName.trim();
    if (contactPersonFirstName !== undefined) contractor.contactPersonFirstName = contactPersonFirstName.trim();
    if (contactPersonLastName !== undefined) contractor.contactPersonLastName = contactPersonLastName.trim();
    if (gender !== undefined) contractor.gender = gender;
    if (birthYear !== undefined) contractor.birthYear = birthYear;
    if (mobileNumber !== undefined) contractor.mobileNumber = mobileNumber.trim();
    if (city !== undefined) contractor.city = city.trim();
    if (province !== undefined) contractor.province = province.trim();
    if (country !== undefined) contractor.country = country.trim();
    if (aboutUs !== undefined) contractor.aboutUs = aboutUs.trim();
    if (contractorSpecializations !== undefined) contractor.contractorSpecializations = contractorSpecializations;
    if (servicesOffered !== undefined) contractor.servicesOffered = servicesOffered;
    if (yearsExperience !== undefined) contractor.yearsExperience = yearsExperience;
    if (serviceAreas !== undefined) contractor.serviceAreas = serviceAreas;
    if (availabilityStatus !== undefined) contractor.availabilityStatus = availabilityStatus;
    if (portfolioImages !== undefined) contractor.portfolioImages = portfolioImages;

    const updatedContractor = await contractor.save();

    return res.status(200).send({
      message: "Profile updated successfully.",
      contractor: {
        _id: updatedContractor._id,
        profilePhoto: updatedContractor.profilePhoto,
        businessName: updatedContractor.businessName,
        contactPersonFirstName: updatedContractor.contactPersonFirstName,
        contactPersonLastName: updatedContractor.contactPersonLastName,
        gender: updatedContractor.gender,
        birthYear: updatedContractor.birthYear,
        email: updatedContractor.email,
        mobileNumber: updatedContractor.mobileNumber,
        city: updatedContractor.city,
        province: updatedContractor.province,
        country: updatedContractor.country,
        aboutUs: updatedContractor.aboutUs,
        contractorSpecializations: updatedContractor.contractorSpecializations,
        servicesOffered: updatedContractor.servicesOffered,
        yearsExperience: updatedContractor.yearsExperience,
        serviceAreas: updatedContractor.serviceAreas,
        availabilityStatus: updatedContractor.availabilityStatus,
        portfolioImages: updatedContractor.portfolioImages,
        averageRating: updatedContractor.averageRating,
        totalReviews: updatedContractor.totalReviews,
        userType: updatedContractor.userType,
        accountStatus: updatedContractor.accountStatus,
        isFeatured: updatedContractor.isFeatured,
        subscriptionPlan: updatedContractor.subscriptionPlan,
        createdAt: updatedContractor.createdAt,
        updatedAt: updatedContractor.updatedAt
      }
    });
  } catch (error) {
    console.error("Update contractor profile error:", error);
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
            folder: "bildflex/contractors",
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

    const contractor = await Contractor.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: result.secure_url },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    return res.status(200).send({
      message: "Profile photo uploaded successfully.",
      imageUrl: result.secure_url,
      contractor
    });
  } catch (error) {
    console.error("Update contractor photo error:", error);
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

    const contractor = await Contractor.findById(req.user.id);

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    const isPasswordCorrect = await contractor.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).send({ error: "Current password is incorrect." });
    }

    contractor.password = newPassword;
    await contractor.save();

    return res.status(200).send({
      message: "Password changed successfully."
    });
  } catch (error) {
    console.error("Change contractor password error:", error);
    return res.status(500).send({
      error: error.message || "Failed to change password."
    });
  }
};

// Deactivate own account
module.exports.deactivateOwnAccount = async (req, res) => {
  try {
    const contractor = await Contractor.findByIdAndUpdate(
      req.user.id,
      { accountStatus: "archived" },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    return res.status(200).send({
      message: "Account deactivated successfully.",
      contractor
    });
  } catch (error) {
    console.error("Deactivate contractor account error:", error);
    return res.status(500).send({
      error: error.message || "Failed to deactivate account."
    });
  }
};

// Admin: get all contractors
module.exports.getAllContractors = async (req, res) => {
  try {
    const contractors = await Contractor.find()
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).send({ contractors });
  } catch (error) {
    console.error("Get all contractors error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch contractors."
    });
  }
};

// Admin: get contractor by ID
module.exports.getContractorByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid contractor ID." });
    }

    const contractor = await Contractor.findById(id).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    return res.status(200).send({ contractor });
  } catch (error) {
    console.error("Get contractor by ID admin error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch contractor."
    });
  }
};

// Admin: update account status
module.exports.updateAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid contractor ID." });
    }

    const allowedStatuses = ["active", "suspended", "archived", "pending"];

    if (!allowedStatuses.includes(accountStatus)) {
      return res.status(400).send({ error: "Invalid account status." });
    }

    const contractor = await Contractor.findByIdAndUpdate(
      id,
      { accountStatus },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    return res.status(200).send({
      message: "Account status updated successfully.",
      contractor
    });
  } catch (error) {
    console.error("Update contractor account status error:", error);
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
      return res.status(400).send({ error: "Invalid contractor ID." });
    }

    const allowedPlans = ["basic", "standard", "premium"];

    if (!allowedPlans.includes(subscriptionPlan)) {
      return res.status(400).send({ error: "Invalid subscription plan." });
    }

    const contractor = await Contractor.findByIdAndUpdate(
      id,
      { subscriptionPlan },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    return res.status(200).send({
      message: "Subscription plan updated successfully.",
      contractor
    });
  } catch (error) {
    console.error("Update contractor subscription plan error:", error);
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
      return res.status(400).send({ error: "Invalid contractor ID." });
    }

    const contractor = await Contractor.findByIdAndUpdate(
      id,
      { isFeatured: !!isFeatured },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    return res.status(200).send({
      message: "Featured status updated successfully.",
      contractor
    });
  } catch (error) {
    console.error("Update contractor featured status error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update featured status."
    });
  }
};

// Admin: archive contractor
module.exports.archiveContractor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid contractor ID." });
    }

    const contractor = await Contractor.findByIdAndUpdate(
      id,
      { accountStatus: "archived" },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!contractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    return res.status(200).send({
      message: "Contractor archived successfully.",
      contractor
    });
  } catch (error) {
    console.error("Archive contractor error:", error);
    return res.status(500).send({
      error: error.message || "Failed to archive contractor."
    });
  }
};

// Admin: delete contractor
module.exports.deleteContractor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid contractor ID." });
    }

    const deletedContractor = await Contractor.findByIdAndDelete(id);

    if (!deletedContractor) {
      return res.status(404).send({ error: "Contractor not found." });
    }

    return res.status(200).send({
      message: "Contractor deleted successfully."
    });
  } catch (error) {
    console.error("Delete contractor error:", error);
    return res.status(500).send({
      error: error.message || "Failed to delete contractor."
    });
  }
};