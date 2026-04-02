const mongoose = require("mongoose");
const Message = require("../models/Message");

const ACTOR_TYPES = ["User", "Handyman", "Designer", "Contractor", "Supplier", "Admin"];
const STATUS_TYPES = ["sent", "delivered", "read", "archived"];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getOwnedMessage = async (messageId, actorId, actorType) => {
  if (!isValidObjectId(messageId)) {
    return { error: { code: 400, message: "Invalid message ID." } };
  }

  const message = await Message.findOne({
    _id: messageId,
    $or: [
      { senderId: actorId, senderType: actorType },
      { recipientId: actorId, recipientType: actorType }
    ]
  })
    .populate("inquiryId")
    .populate("bookingId");

  if (!message) {
    return { error: { code: 404, message: "Message not found." } };
  }

  return { message };
};

const getMyMessagesByType = async (req, res, actorType) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, senderType: actorType },
        { recipientId: req.user.id, recipientType: actorType }
      ]
    })
      .populate("inquiryId")
      .populate("bookingId")
      .sort({ createdAt: -1 });

    return res.status(200).send({ messages });
  } catch (error) {
    console.error(`Get ${actorType} messages error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to fetch ${actorType.toLowerCase()} messages.`
    });
  }
};

const sendMessageByType = async (req, res, senderType, defaultCategory) => {
  try {
    const {
      recipientId,
      recipientType,
      inquiryId,
      bookingId,
      subject,
      message,
      isAdminMessage
    } = req.body;

    if (!recipientId || !recipientType || !message) {
      return res.status(400).send({
        error: "Recipient ID, recipient type, and message are required."
      });
    }

    if (!isValidObjectId(recipientId)) {
      return res.status(400).send({ error: "Invalid recipient ID." });
    }

    if (!ACTOR_TYPES.includes(recipientType)) {
      return res.status(400).send({ error: "Invalid recipient type." });
    }

    if (inquiryId && !isValidObjectId(inquiryId)) {
      return res.status(400).send({ error: "Invalid inquiry ID." });
    }

    if (bookingId && !isValidObjectId(bookingId)) {
      return res.status(400).send({ error: "Invalid booking ID." });
    }

    const createdMessage = await Message.create({
      senderId: req.user.id,
      senderType,
      recipientId,
      recipientType,
      messageCategory: defaultCategory,
      isAdminMessage: senderType === "Admin" ? true : !!isAdminMessage,
      inquiryId: inquiryId || null,
      bookingId: bookingId || null,
      subject,
      message,
      status: "sent"
    });

    return res.status(201).send({
      message: "Message sent successfully.",
      data: createdMessage
    });
  } catch (error) {
    console.error(`Send ${senderType} message error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to send ${senderType.toLowerCase()} message.`
    });
  }
};

const getMessageByType = async (req, res, actorType) => {
  try {
    const { id } = req.params;
    const result = await getOwnedMessage(id, req.user.id, actorType);

    if (result.error) {
      return res.status(result.error.code).send({ error: result.error.message });
    }

    return res.status(200).send({ message: result.message });
  } catch (error) {
    console.error(`Get ${actorType} message by ID error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to fetch ${actorType.toLowerCase()} message.`
    });
  }
};

const markMessageAsReadByType = async (req, res, actorType) => {
  try {
    const { id } = req.params;
    const result = await getOwnedMessage(id, req.user.id, actorType);

    if (result.error) {
      return res.status(result.error.code).send({ error: result.error.message });
    }

    if (
      String(result.message.recipientId) !== String(req.user.id) ||
      result.message.recipientType !== actorType
    ) {
      return res.status(403).send({
        error: "Only the recipient can mark this message as read."
      });
    }

    result.message.isRead = true;
    result.message.status = "read";
    await result.message.save();

    return res.status(200).send({
      message: "Message marked as read.",
      data: result.message
    });
  } catch (error) {
    console.error(`Mark ${actorType} message as read error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to update ${actorType.toLowerCase()} message.`
    });
  }
};

const archiveMessageByType = async (req, res, actorType) => {
  try {
    const { id } = req.params;
    const result = await getOwnedMessage(id, req.user.id, actorType);

    if (result.error) {
      return res.status(result.error.code).send({ error: result.error.message });
    }

    result.message.status = "archived";
    await result.message.save();

    return res.status(200).send({
      message: "Message archived successfully.",
      data: result.message
    });
  } catch (error) {
    console.error(`Archive ${actorType} message error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to archive ${actorType.toLowerCase()} message.`
    });
  }
};

// User
module.exports.getMyMessages = async (req, res) =>
  getMyMessagesByType(req, res, "User");

module.exports.sendMessage = async (req, res) =>
  sendMessageByType(req, res, "User", "user");

module.exports.getMessageById = async (req, res) =>
  getMessageByType(req, res, "User");

module.exports.markMessageAsRead = async (req, res) =>
  markMessageAsReadByType(req, res, "User");

module.exports.archiveMessage = async (req, res) =>
  archiveMessageByType(req, res, "User");

// Handyman
module.exports.getMyHandymanMessages = async (req, res) =>
  getMyMessagesByType(req, res, "Handyman");

module.exports.sendHandymanMessage = async (req, res) =>
  sendMessageByType(req, res, "Handyman", "provider");

module.exports.getHandymanMessageById = async (req, res) =>
  getMessageByType(req, res, "Handyman");

module.exports.markHandymanMessageAsRead = async (req, res) =>
  markMessageAsReadByType(req, res, "Handyman");

module.exports.archiveHandymanMessage = async (req, res) =>
  archiveMessageByType(req, res, "Handyman");

// Designer
module.exports.getMyDesignerMessages = async (req, res) =>
  getMyMessagesByType(req, res, "Designer");

module.exports.sendDesignerMessage = async (req, res) =>
  sendMessageByType(req, res, "Designer", "provider");

module.exports.getDesignerMessageById = async (req, res) =>
  getMessageByType(req, res, "Designer");

module.exports.markDesignerMessageAsRead = async (req, res) =>
  markMessageAsReadByType(req, res, "Designer");

module.exports.archiveDesignerMessage = async (req, res) =>
  archiveMessageByType(req, res, "Designer");

// Contractor
module.exports.getMyContractorMessages = async (req, res) =>
  getMyMessagesByType(req, res, "Contractor");

module.exports.sendContractorMessage = async (req, res) =>
  sendMessageByType(req, res, "Contractor", "provider");

module.exports.getContractorMessageById = async (req, res) =>
  getMessageByType(req, res, "Contractor");

module.exports.markContractorMessageAsRead = async (req, res) =>
  markMessageAsReadByType(req, res, "Contractor");

module.exports.archiveContractorMessage = async (req, res) =>
  archiveMessageByType(req, res, "Contractor");

// Supplier
module.exports.getMySupplierMessages = async (req, res) =>
  getMyMessagesByType(req, res, "Supplier");

module.exports.sendSupplierMessage = async (req, res) =>
  sendMessageByType(req, res, "Supplier", "provider");

module.exports.getSupplierMessageById = async (req, res) =>
  getMessageByType(req, res, "Supplier");

module.exports.markSupplierMessageAsRead = async (req, res) =>
  markMessageAsReadByType(req, res, "Supplier");

module.exports.archiveSupplierMessage = async (req, res) =>
  archiveMessageByType(req, res, "Supplier");

// Admin direct messages
module.exports.getMyAdminMessages = async (req, res) =>
  getMyMessagesByType(req, res, "Admin");

module.exports.sendAdminMessage = async (req, res) =>
  sendMessageByType(req, res, "Admin", "admin");

module.exports.getAdminMessageById = async (req, res) =>
  getMessageByType(req, res, "Admin");

module.exports.markAdminMessageAsRead = async (req, res) =>
  markMessageAsReadByType(req, res, "Admin");

module.exports.archiveAdminMessage = async (req, res) =>
  archiveMessageByType(req, res, "Admin");

// Admin management
module.exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Message.find()
      .populate("inquiryId")
      .populate("bookingId")
      .sort({ createdAt: -1 });

    return res.status(200).send({ messages });
  } catch (error) {
    console.error("Get all messages error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch messages."
    });
  }
};

module.exports.getMessageAdminById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid message ID." });
    }

    const message = await Message.findById(id)
      .populate("inquiryId")
      .populate("bookingId");

    if (!message) {
      return res.status(404).send({ error: "Message not found." });
    }

    return res.status(200).send({ message });
  } catch (error) {
    console.error("Get message admin by ID error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch message."
    });
  }
};

module.exports.updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid message ID." });
    }

    if (!STATUS_TYPES.includes(status)) {
      return res.status(400).send({ error: "Invalid message status." });
    }

    const updateData = { status };
    if (status === "read") {
      updateData.isRead = true;
    }

    const message = await Message.findByIdAndUpdate(id, updateData, {
      new: true
    });

    if (!message) {
      return res.status(404).send({ error: "Message not found." });
    }

    return res.status(200).send({
      message: "Message status updated successfully.",
      data: message
    });
  } catch (error) {
    console.error("Update message status error:", error);
    return res.status(500).send({
      error: error.message || "Failed to update message status."
    });
  }
};

module.exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid message ID." });
    }

    const deletedMessage = await Message.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).send({ error: "Message not found." });
    }

    return res.status(200).send({
      message: "Message deleted successfully."
    });
  } catch (error) {
    console.error("Delete message error:", error);
    return res.status(500).send({
      error: error.message || "Failed to delete message."
    });
  }
};