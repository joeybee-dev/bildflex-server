const mongoose = require("mongoose");
const Inquiry = require("../models/Inquiry");

const PROVIDER_TYPES = ["Handyman", "Designer", "Contractor", "Supplier"];
const STATUS_TYPES = ["pending", "read", "replied", "closed"];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getProviderInquiry = async (inquiryId, providerId, providerType) => {
  if (!isValidObjectId(inquiryId)) {
    return { error: { code: 400, message: "Invalid inquiry ID." } };
  }

  const inquiry = await Inquiry.findOne({
    _id: inquiryId,
    recipientId: providerId,
    recipientType: providerType
  }).populate("senderId", "-password");

  if (!inquiry) {
    return { error: { code: 404, message: "Inquiry not found." } };
  }

  return { inquiry };
};

// User: create inquiry
module.exports.createInquiry = async (req, res) => {
  try {
    const { recipientId, recipientType, subject, message } = req.body;

    if (!recipientId || !recipientType || !message) {
      return res.status(400).send({
        error: "Recipient ID, recipient type, and message are required."
      });
    }

    if (!isValidObjectId(recipientId)) {
      return res.status(400).send({ error: "Invalid recipient ID." });
    }

    if (!PROVIDER_TYPES.includes(recipientType)) {
      return res.status(400).send({ error: "Invalid recipient type." });
    }

    const inquiry = await Inquiry.create({
      senderId: req.user.id,
      recipientId,
      recipientType,
      subject,
      message
    });

    return res.status(201).send({
      message: "Inquiry created successfully.",
      inquiry
    });
  } catch (error) {
    console.error("Create inquiry error:", error);
    return res.status(500).send({
      error: error.message || "Failed to create inquiry."
    });
  }
};

// User: get my inquiries
module.exports.getMyInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ senderId: req.user.id })
      .sort({ createdAt: -1 });

    return res.status(200).send({ inquiries });
  } catch (error) {
    console.error("Get my inquiries error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch inquiries."
    });
  }
};

// User: get one inquiry by id
module.exports.getInquiryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid inquiry ID." });
    }

    const inquiry = await Inquiry.findOne({
      _id: id,
      senderId: req.user.id
    });

    if (!inquiry) {
      return res.status(404).send({ error: "Inquiry not found." });
    }

    return res.status(200).send({ inquiry });
  } catch (error) {
    console.error("Get inquiry by ID error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch inquiry."
    });
  }
};

// Shared provider helpers
const getMyProviderInquiries = async (req, res, providerType) => {
  try {
    const inquiries = await Inquiry.find({
      recipientId: req.user.id,
      recipientType: providerType
    })
      .populate("senderId", "-password")
      .sort({ createdAt: -1 });

    return res.status(200).send({ inquiries });
  } catch (error) {
    console.error(`Get ${providerType} inquiries error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to fetch ${providerType.toLowerCase()} inquiries.`
    });
  }
};

const getProviderInquiryById = async (req, res, providerType) => {
  try {
    const { id } = req.params;
    const result = await getProviderInquiry(id, req.user.id, providerType);

    if (result.error) {
      return res.status(result.error.code).send({ error: result.error.message });
    }

    return res.status(200).send({ inquiry: result.inquiry });
  } catch (error) {
    console.error(`Get ${providerType} inquiry by ID error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to fetch ${providerType.toLowerCase()} inquiry.`
    });
  }
};

const markProviderInquiryAsRead = async (req, res, providerType) => {
  try {
    const { id } = req.params;
    const result = await getProviderInquiry(id, req.user.id, providerType);

    if (result.error) {
      return res.status(result.error.code).send({ error: result.error.message });
    }

    if (result.inquiry.status === "pending") {
      result.inquiry.status = "read";
      await result.inquiry.save();
    }

    return res.status(200).send({
      message: "Inquiry marked as read.",
      inquiry: result.inquiry
    });
  } catch (error) {
    console.error(`Mark ${providerType} inquiry as read error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to update ${providerType.toLowerCase()} inquiry.`
    });
  }
};

const replyToProviderInquiry = async (req, res, providerType) => {
  try {
    const { id } = req.params;
    const { replyMessage } = req.body;

    if (!replyMessage || !replyMessage.trim()) {
      return res.status(400).send({ error: "Reply message is required." });
    }

    const result = await getProviderInquiry(id, req.user.id, providerType);

    if (result.error) {
      return res.status(result.error.code).send({ error: result.error.message });
    }

    result.inquiry.reply = {
      message: replyMessage.trim(),
      repliedAt: new Date()
    };
    result.inquiry.status = "replied";

    await result.inquiry.save();

    return res.status(200).send({
      message: "Inquiry replied successfully.",
      inquiry: result.inquiry
    });
  } catch (error) {
    console.error(`Reply to ${providerType} inquiry error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to reply to ${providerType.toLowerCase()} inquiry.`
    });
  }
};

const closeProviderInquiry = async (req, res, providerType) => {
  try {
    const { id } = req.params;
    const result = await getProviderInquiry(id, req.user.id, providerType);

    if (result.error) {
      return res.status(result.error.code).send({ error: result.error.message });
    }

    result.inquiry.status = "closed";
    await result.inquiry.save();

    return res.status(200).send({
      message: "Inquiry closed successfully.",
      inquiry: result.inquiry
    });
  } catch (error) {
    console.error(`Close ${providerType} inquiry error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to close ${providerType.toLowerCase()} inquiry.`
    });
  }
};

// Handyman
module.exports.getMyHandymanInquiries = async (req, res) =>
  getMyProviderInquiries(req, res, "Handyman");

module.exports.getHandymanInquiryById = async (req, res) =>
  getProviderInquiryById(req, res, "Handyman");

module.exports.markHandymanInquiryAsRead = async (req, res) =>
  markProviderInquiryAsRead(req, res, "Handyman");

module.exports.replyToHandymanInquiry = async (req, res) =>
  replyToProviderInquiry(req, res, "Handyman");

module.exports.closeHandymanInquiry = async (req, res) =>
  closeProviderInquiry(req, res, "Handyman");

// Designer
module.exports.getMyDesignerInquiries = async (req, res) =>
  getMyProviderInquiries(req, res, "Designer");

module.exports.getDesignerInquiryById = async (req, res) =>
  getProviderInquiryById(req, res, "Designer");

module.exports.markDesignerInquiryAsRead = async (req, res) =>
  markProviderInquiryAsRead(req, res, "Designer");

module.exports.replyToDesignerInquiry = async (req, res) =>
  replyToProviderInquiry(req, res, "Designer");

module.exports.closeDesignerInquiry = async (req, res) =>
  closeProviderInquiry(req, res, "Designer");

// Contractor
module.exports.getMyContractorInquiries = async (req, res) =>
  getMyProviderInquiries(req, res, "Contractor");

module.exports.getContractorInquiryById = async (req, res) =>
  getProviderInquiryById(req, res, "Contractor");

module.exports.markContractorInquiryAsRead = async (req, res) =>
  markProviderInquiryAsRead(req, res, "Contractor");

module.exports.replyToContractorInquiry = async (req, res) =>
  replyToProviderInquiry(req, res, "Contractor");

module.exports.closeContractorInquiry = async (req, res) =>
  closeProviderInquiry(req, res, "Contractor");

// Supplier
module.exports.getMySupplierInquiries = async (req, res) =>
  getMyProviderInquiries(req, res, "Supplier");

module.exports.getSupplierInquiryById = async (req, res) =>
  getProviderInquiryById(req, res, "Supplier");

module.exports.markSupplierInquiryAsRead = async (req, res) =>
  markProviderInquiryAsRead(req, res, "Supplier");

module.exports.replyToSupplierInquiry = async (req, res) =>
  replyToProviderInquiry(req, res, "Supplier");

module.exports.closeSupplierInquiry = async (req, res) =>
  closeProviderInquiry(req, res, "Supplier");

// Admin: get all inquiries
module.exports.getAllInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find()
      .populate("senderId", "-password")
      .sort({ createdAt: -1 });

    return res.status(200).send({ inquiries });
  } catch (error) {
    console.error("Get all inquiries error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch inquiries."
    });
  }
};

// Admin: get one inquiry
module.exports.getInquiryAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid inquiry ID." });
    }

    const inquiry = await Inquiry.findById(id).populate("senderId", "-password");

    if (!inquiry) {
      return res.status(404).send({ error: "Inquiry not found." });
    }

    return res.status(200).send({ inquiry });
  } catch (error) {
    console.error("Get inquiry admin by ID error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch inquiry."
    });
  }
};

// Admin: update status
module.exports.updateInquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid inquiry ID." });
    }

    if (!STATUS_TYPES.includes(status)) {
      return res.status(400).send({ error: "Invalid inquiry status." });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!inquiry) {
      return res.status(404).send({ error: "Inquiry not found." });
    }

    return res.status(200).send({
      message: "Inquiry status updated successfully.",
      inquiry
    });
  } catch (error) {
    console.error("Update inquiry status error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update inquiry status."
    });
  }
};

// Admin: delete inquiry
module.exports.deleteInquiry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid inquiry ID." });
    }

    const deletedInquiry = await Inquiry.findByIdAndDelete(id);

    if (!deletedInquiry) {
      return res.status(404).send({ error: "Inquiry not found." });
    }

    return res.status(200).send({
      message: "Inquiry deleted successfully."
    });
  } catch (error) {
    console.error("Delete inquiry error:", error);
    return res.status(500).send({
      error: error.message || "Failed to delete inquiry."
    });
  }
};