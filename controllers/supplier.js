const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const Supplier = require("../models/Supplier");
const crypto = require("crypto");
const mongoose = require("mongoose");
const auth = require("../middlewares/auth");
const sendEmail = require("../utils/sendEmail");

// Register supplier
module.exports.registerSupplier = async (req, res) => {
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
      productCategories,
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

    const existingSupplier = await Supplier.findOne({ email: normalizedEmail });

    if (existingSupplier) {
      return res.status(409).send({ error: "Email already registered." });
    }

    const newSupplier = new Supplier({
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
      productCategories,
      servicesOffered,
      yearsExperience,
      serviceAreas,
      availabilityStatus,
      portfolioImages,
      password
    });

    const savedSupplier = await newSupplier.save();

    return res.status(201).send({
      message: "Supplier registered successfully.",
      supplier: {
        _id: savedSupplier._id,
        profilePhoto: savedSupplier.profilePhoto,
        businessName: savedSupplier.businessName,
        contactPersonFirstName: savedSupplier.contactPersonFirstName,
        contactPersonLastName: savedSupplier.contactPersonLastName,
        email: savedSupplier.email,
        userType: savedSupplier.userType,
        accountStatus: savedSupplier.accountStatus,
        subscriptionPlan: savedSupplier.subscriptionPlan
      }
    });
  } catch (error) {
    console.error("Register supplier error:", error);
    return res.status(500).send({
      error: error.message || "Failed to register supplier."
    });
  }
};

// Login supplier
module.exports.loginSupplier = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();
    const supplier = await Supplier.findOne({ email: normalizedEmail });

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    const isPasswordCorrect = await supplier.comparePassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).send({ error: "Incorrect email or password." });
    }

    if (supplier.accountStatus !== "active") {
      return res.status(403).send({
        error: `Account is ${supplier.accountStatus}.`
      });
    }

    const accessToken = auth.createAccessToken(supplier);

    return res.status(200).send({
      access: accessToken,
      supplier: {
        _id: supplier._id,
        profilePhoto: supplier.profilePhoto,
        businessName: supplier.businessName,
        contactPersonFirstName: supplier.contactPersonFirstName,
        contactPersonLastName: supplier.contactPersonLastName,
        email: supplier.email,
        userType: supplier.userType,
        accountStatus: supplier.accountStatus,
        subscriptionPlan: supplier.subscriptionPlan
      }
    });
  } catch (error) {
    console.error("Login supplier error:", error);
    return res.status(500).send({
      error: error.message || "Failed to login supplier."
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
    const supplier = await Supplier.findOne({ email: normalizedEmail });

    if (!supplier) {
      return res.status(200).send({
        message: "If an account with that email exists, a reset link has been generated."
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    supplier.passwordResetToken = resetToken;
    supplier.passwordResetExpires = Date.now() + 1000 * 60 * 15;

    await supplier.save();

    const resetLink = `${process.env.CLIENT_URL}/reset-password-supplier/${resetToken}`;

    // Uncomment when sendEmail is ready
    // await sendEmail({
    //   to: supplier.email,
    //   subject: "Reset Your Password",
    //   html: `<p>Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`
    // });

    return res.status(200).send({
      message: "Password reset link generated successfully.",
      resetLink
    });
  } catch (error) {
    console.error("Forgot password supplier error:", error);
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

    const supplier = await Supplier.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!supplier) {
      return res.status(400).send({
        error: "Invalid or expired reset token."
      });
    }

    supplier.password = password;
    supplier.passwordResetToken = "";
    supplier.passwordResetExpires = null;

    await supplier.save();

    return res.status(200).send({
      message: "Password reset successful."
    });
  } catch (error) {
    console.error("Reset password supplier error:", error);
    return res.status(500).send({
      error: error.message || "Failed to reset password."
    });
  }
};

// Public: get active suppliers
module.exports.getActiveSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({ accountStatus: "active" })
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ isFeatured: -1, createdAt: -1 });

    return res.status(200).send({ suppliers });
  } catch (error) {
    console.error("Get active suppliers error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch active suppliers."
    });
  }
};

// Public: get featured suppliers
module.exports.getFeaturedSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({
      isFeatured: true,
      accountStatus: "active"
    })
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).send({ suppliers });
  } catch (error) {
    console.error("Get featured suppliers error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch featured suppliers."
    });
  }
};

// Public: get one supplier profile
module.exports.getSupplierPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid supplier ID." });
    }

    const supplier = await Supplier.findOne({
      _id: id,
      accountStatus: "active"
    }).select("-password -passwordResetToken -passwordResetExpires");

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    return res.status(200).send({ supplier });
  } catch (error) {
    console.error("Get supplier public profile error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch supplier profile."
    });
  }
};

// Get logged-in supplier details
module.exports.getSupplierDetails = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.user.id).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    return res.status(200).send({ supplier });
  } catch (error) {
    console.error("Get supplier details error:", error);
    return res.status(500).send({
      error: error.message || "Failed to get supplier details."
    });
  }
};

// Update profile
module.exports.updateProfile = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.user.id);

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
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
      productCategories,
      servicesOffered,
      yearsExperience,
      serviceAreas,
      availabilityStatus,
      portfolioImages
    } = req.body;

    if (profilePhoto !== undefined) supplier.profilePhoto = profilePhoto;
    if (businessName !== undefined) supplier.businessName = businessName.trim();
    if (contactPersonFirstName !== undefined) supplier.contactPersonFirstName = contactPersonFirstName.trim();
    if (contactPersonLastName !== undefined) supplier.contactPersonLastName = contactPersonLastName.trim();
    if (gender !== undefined) supplier.gender = gender;
    if (birthYear !== undefined) supplier.birthYear = birthYear;
    if (mobileNumber !== undefined) supplier.mobileNumber = mobileNumber.trim();
    if (city !== undefined) supplier.city = city.trim();
    if (province !== undefined) supplier.province = province.trim();
    if (country !== undefined) supplier.country = country.trim();
    if (aboutUs !== undefined) supplier.aboutUs = aboutUs.trim();
    if (productCategories !== undefined) supplier.productCategories = productCategories;
    if (servicesOffered !== undefined) supplier.servicesOffered = servicesOffered;
    if (yearsExperience !== undefined) supplier.yearsExperience = yearsExperience;
    if (serviceAreas !== undefined) supplier.serviceAreas = serviceAreas;
    if (availabilityStatus !== undefined) supplier.availabilityStatus = availabilityStatus;
    if (portfolioImages !== undefined) supplier.portfolioImages = portfolioImages;

    const updatedSupplier = await supplier.save();

    return res.status(200).send({
      message: "Profile updated successfully.",
      supplier: {
        _id: updatedSupplier._id,
        profilePhoto: updatedSupplier.profilePhoto,
        businessName: updatedSupplier.businessName,
        contactPersonFirstName: updatedSupplier.contactPersonFirstName,
        contactPersonLastName: updatedSupplier.contactPersonLastName,
        gender: updatedSupplier.gender,
        birthYear: updatedSupplier.birthYear,
        email: updatedSupplier.email,
        mobileNumber: updatedSupplier.mobileNumber,
        city: updatedSupplier.city,
        province: updatedSupplier.province,
        country: updatedSupplier.country,
        aboutUs: updatedSupplier.aboutUs,
        productCategories: updatedSupplier.productCategories,
        servicesOffered: updatedSupplier.servicesOffered,
        yearsExperience: updatedSupplier.yearsExperience,
        serviceAreas: updatedSupplier.serviceAreas,
        availabilityStatus: updatedSupplier.availabilityStatus,
        portfolioImages: updatedSupplier.portfolioImages,
        averageRating: updatedSupplier.averageRating,
        totalReviews: updatedSupplier.totalReviews,
        userType: updatedSupplier.userType,
        accountStatus: updatedSupplier.accountStatus,
        isFeatured: updatedSupplier.isFeatured,
        subscriptionPlan: updatedSupplier.subscriptionPlan,
        createdAt: updatedSupplier.createdAt,
        updatedAt: updatedSupplier.updatedAt
      }
    });
  } catch (error) {
    console.error("Update supplier profile error:", error);
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
            folder: "bildflex/suppliers",
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

    const supplier = await Supplier.findByIdAndUpdate(
      req.user.id,
      { profilePhoto: result.secure_url },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    return res.status(200).send({
      message: "Profile photo uploaded successfully.",
      imageUrl: result.secure_url,
      supplier
    });
  } catch (error) {
    console.error("Update supplier photo error:", error);
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

    const supplier = await Supplier.findById(req.user.id);

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    const isPasswordCorrect = await supplier.comparePassword(currentPassword);

    if (!isPasswordCorrect) {
      return res.status(401).send({ error: "Current password is incorrect." });
    }

    supplier.password = newPassword;
    await supplier.save();

    return res.status(200).send({
      message: "Password changed successfully."
    });
  } catch (error) {
    console.error("Change supplier password error:", error);
    return res.status(500).send({
      error: error.message || "Failed to change password."
    });
  }
};

// Deactivate own account
module.exports.deactivateOwnAccount = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.user.id,
      { accountStatus: "archived" },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    return res.status(200).send({
      message: "Account deactivated successfully.",
      supplier
    });
  } catch (error) {
    console.error("Deactivate supplier account error:", error);
    return res.status(500).send({
      error: error.message || "Failed to deactivate account."
    });
  }
};

// Admin: get all suppliers
module.exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find()
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).send({ suppliers });
  } catch (error) {
    console.error("Get all suppliers error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch suppliers."
    });
  }
};

// Admin: get supplier by ID
module.exports.getSupplierByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid supplier ID." });
    }

    const supplier = await Supplier.findById(id).select(
      "-password -passwordResetToken -passwordResetExpires"
    );

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    return res.status(200).send({ supplier });
  } catch (error) {
    console.error("Get supplier by ID admin error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch supplier."
    });
  }
};

// Admin: update account status
module.exports.updateAccountStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { accountStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid supplier ID." });
    }

    const allowedStatuses = ["active", "suspended", "archived", "pending"];

    if (!allowedStatuses.includes(accountStatus)) {
      return res.status(400).send({ error: "Invalid account status." });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { accountStatus },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    return res.status(200).send({
      message: "Account status updated successfully.",
      supplier
    });
  } catch (error) {
    console.error("Update supplier account status error:", error);
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
      return res.status(400).send({ error: "Invalid supplier ID." });
    }

    const allowedPlans = ["basic", "standard", "premium"];

    if (!allowedPlans.includes(subscriptionPlan)) {
      return res.status(400).send({ error: "Invalid subscription plan." });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { subscriptionPlan },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    return res.status(200).send({
      message: "Subscription plan updated successfully.",
      supplier
    });
  } catch (error) {
    console.error("Update supplier subscription plan error:", error);
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
      return res.status(400).send({ error: "Invalid supplier ID." });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { isFeatured: !!isFeatured },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    return res.status(200).send({
      message: "Featured status updated successfully.",
      supplier
    });
  } catch (error) {
    console.error("Update supplier featured status error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update featured status."
    });
  }
};

// Admin: archive supplier
module.exports.archiveSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid supplier ID." });
    }

    const supplier = await Supplier.findByIdAndUpdate(
      id,
      { accountStatus: "archived" },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!supplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    return res.status(200).send({
      message: "Supplier archived successfully.",
      supplier
    });
  } catch (error) {
    console.error("Archive supplier error:", error);
    return res.status(500).send({
      error: error.message || "Failed to archive supplier."
    });
  }
};

// Admin: delete supplier
module.exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send({ error: "Invalid supplier ID." });
    }

    const deletedSupplier = await Supplier.findByIdAndDelete(id);

    if (!deletedSupplier) {
      return res.status(404).send({ error: "Supplier not found." });
    }

    return res.status(200).send({
      message: "Supplier deleted successfully."
    });
  } catch (error) {
    console.error("Delete supplier error:", error);
    return res.status(500).send({
      error: error.message || "Failed to delete supplier."
    });
  }
};