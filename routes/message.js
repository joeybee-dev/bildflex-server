const express = require("express");
const router = express.Router();

const messageController = require("../controllers/message");
const { verify, verifyAdmin } = require("../middlewares/auth");

// user
router.get("/users/messages", verify, messageController.getMyMessages);
router.post("/users/messages", verify, messageController.sendMessage);
router.get("/users/messages/:id", verify, messageController.getMessageById);
router.patch("/users/messages/:id/read", verify, messageController.markMessageAsRead);
router.patch("/users/messages/:id/archive", verify, messageController.archiveMessage);

// handyman
router.get("/handymen/messages", verify, messageController.getMyHandymanMessages);
router.post("/handymen/messages", verify, messageController.sendHandymanMessage);
router.get("/handymen/messages/:id", verify, messageController.getHandymanMessageById);
router.patch("/handymen/messages/:id/read", verify, messageController.markHandymanMessageAsRead);
router.patch("/handymen/messages/:id/archive", verify, messageController.archiveHandymanMessage);

// designer
router.get("/designers/messages", verify, messageController.getMyDesignerMessages);
router.post("/designers/messages", verify, messageController.sendDesignerMessage);
router.get("/designers/messages/:id", verify, messageController.getDesignerMessageById);
router.patch("/designers/messages/:id/read", verify, messageController.markDesignerMessageAsRead);
router.patch("/designers/messages/:id/archive", verify, messageController.archiveDesignerMessage);

// contractor
router.get("/contractors/messages", verify, messageController.getMyContractorMessages);
router.post("/contractors/messages", verify, messageController.sendContractorMessage);
router.get("/contractors/messages/:id", verify, messageController.getContractorMessageById);
router.patch("/contractors/messages/:id/read", verify, messageController.markContractorMessageAsRead);
router.patch("/contractors/messages/:id/archive", verify, messageController.archiveContractorMessage);

// supplier
router.get("/suppliers/messages", verify, messageController.getMySupplierMessages);
router.post("/suppliers/messages", verify, messageController.sendSupplierMessage);
router.get("/suppliers/messages/:id", verify, messageController.getSupplierMessageById);
router.patch("/suppliers/messages/:id/read", verify, messageController.markSupplierMessageAsRead);
router.patch("/suppliers/messages/:id/archive", verify, messageController.archiveSupplierMessage);

// admin direct messages
router.get("/admin/messages", verify, verifyAdmin, messageController.getMyAdminMessages);
router.post("/admin/messages", verify, verifyAdmin, messageController.sendAdminMessage);
router.get("/admin/messages/:id", verify, verifyAdmin, messageController.getAdminMessageById);
router.patch("/admin/messages/:id/read", verify, verifyAdmin, messageController.markAdminMessageAsRead);
router.patch("/admin/messages/:id/archive", verify, verifyAdmin, messageController.archiveAdminMessage);

// admin management
router.get("/messages/all", verify, verifyAdmin, messageController.getAllMessages);
router.get("/messages/:id", verify, verifyAdmin, messageController.getMessageAdminById);
router.patch("/messages/:id/status", verify, verifyAdmin, messageController.updateMessageStatus);
router.delete("/messages/:id/delete", verify, verifyAdmin, messageController.deleteMessage);

module.exports = router;