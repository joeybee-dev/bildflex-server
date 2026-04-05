const mongoose = require("mongoose");
const User = require("../models/User");
const Handyman = require("../models/Handyman");
const Designer = require("../models/Designer");
const Contractor = require("../models/Contractor");
const Supplier = require("../models/Supplier");
const Inquiry = require("../models/Inquiry");
const Booking = require("../models/Booking");
const Message = require("../models/Message");

module.exports.getDashboardCounts = async (req, res) => {
  try {
    const [
      users,
      handymen,
      designers,
      contractors,
      suppliers,
      inquiries,
      bookings,
      messages
    ] = await Promise.all([
      User.countDocuments({ userType: "user" }),
      Handyman.countDocuments(),
      Designer.countDocuments(),
      Contractor.countDocuments(),
      Supplier.countDocuments(),
      Inquiry.countDocuments(),
      Booking.countDocuments(),
      Message.countDocuments()
    ]);

    return res.status(200).json({
      success: true,
      counts: {
        users,
        handymen,
        designers,
        contractors,
        suppliers,
        inquiries,
        bookings,
        messages
      }
    });
  } catch (error) {
    console.error("Admin dashboard counts error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard counts",
      error: error.message
    });
  }
};

module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("Get all users error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message
    });
  }
};

module.exports.getAllHandymen = async (req, res) => {
  try {
    const handymen = await Handyman.find({})
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, handymen });
  } catch (error) {
    console.error("Get all handymen error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch handymen",
      error: error.message
    });
  }
};

module.exports.getAllDesigners = async (req, res) => {
  try {
    const designers = await Designer.find({})
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, designers });
  } catch (error) {
    console.error("Get all designers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch designers",
      error: error.message
    });
  }
};

module.exports.getAllContractors = async (req, res) => {
  try {
    const contractors = await Contractor.find({})
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, contractors });
  } catch (error) {
    console.error("Get all contractors error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contractors",
      error: error.message
    });
  }
};

module.exports.getAllSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({})
      .select("-password -passwordResetToken -passwordResetExpires")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, suppliers });
  } catch (error) {
    console.error("Get all suppliers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers",
      error: error.message
    });
  }
};

module.exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, inquiries });
  } catch (error) {
    console.error("Get all inquiries error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inquiries",
      error: error.message
    });
  }
};

module.exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("Get all bookings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message
    });
  }
};

module.exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Get all messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message
    });
  }
};

module.exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { accountStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const allowedStatuses = ["active", "suspended", "archived", "pending"];
    if (!allowedStatuses.includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status"
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { accountStatus },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "User status updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Update user status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message
    });
  }
};

module.exports.updateProviderStatus = async (req, res) => {
  try {
    const { providerType, providerId } = req.params;
    const { accountStatus } = req.body;

    const allowedStatuses = ["active", "suspended", "archived", "pending"];
    if (!allowedStatuses.includes(accountStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider ID"
      });
    }

    const providerModels = {
      handymen: Handyman,
      designers: Designer,
      contractors: Contractor,
      suppliers: Supplier
    };

    const Model = providerModels[providerType];

    if (!Model) {
      return res.status(400).json({
        success: false,
        message: "Invalid provider type"
      });
    }

    const updatedProvider = await Model.findByIdAndUpdate(
      providerId,
      { accountStatus },
      { new: true }
    ).select("-password -passwordResetToken -passwordResetExpires");

    if (!updatedProvider) {
      return res.status(404).json({
        success: false,
        message: "Provider not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Provider status updated successfully",
      provider: updatedProvider
    });
  } catch (error) {
    console.error("Update provider status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update provider status",
      error: error.message
    });
  }
};