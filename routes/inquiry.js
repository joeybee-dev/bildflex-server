const express = require("express");
const router = express.Router();

const inquiryController = require("../controllers/inquiry");
const { verify, verifyAdmin } = require("../middlewares/auth");

// user routes
router.get("/users/my-inquiries", verify, inquiryController.getMyInquiries);
router.post("/users/inquiries", verify, inquiryController.createInquiry);
router.get("/users/inquiries/:id", verify, inquiryController.getInquiryById);

// handyman routes
router.get("/handymen/inquiries", verify, inquiryController.getMyHandymanInquiries);
router.get("/handymen/inquiries/:id", verify, inquiryController.getHandymanInquiryById);
router.patch("/handymen/inquiries/:id/read", verify, inquiryController.markHandymanInquiryAsRead);
router.patch("/handymen/inquiries/:id/reply", verify, inquiryController.replyToHandymanInquiry);
router.patch("/handymen/inquiries/:id/close", verify, inquiryController.closeHandymanInquiry);

// designer routes
router.get("/designers/inquiries", verify, inquiryController.getMyDesignerInquiries);
router.get("/designers/inquiries/:id", verify, inquiryController.getDesignerInquiryById);
router.patch("/designers/inquiries/:id/read", verify, inquiryController.markDesignerInquiryAsRead);
router.patch("/designers/inquiries/:id/reply", verify, inquiryController.replyToDesignerInquiry);
router.patch("/designers/inquiries/:id/close", verify, inquiryController.closeDesignerInquiry);

// contractor routes
router.get("/contractors/inquiries", verify, inquiryController.getMyContractorInquiries);
router.get("/contractors/inquiries/:id", verify, inquiryController.getContractorInquiryById);
router.patch("/contractors/inquiries/:id/read", verify, inquiryController.markContractorInquiryAsRead);
router.patch("/contractors/inquiries/:id/reply", verify, inquiryController.replyToContractorInquiry);
router.patch("/contractors/inquiries/:id/close", verify, inquiryController.closeContractorInquiry);

// supplier routes
router.get("/suppliers/inquiries", verify, inquiryController.getMySupplierInquiries);
router.get("/suppliers/inquiries/:id", verify, inquiryController.getSupplierInquiryById);
router.patch("/suppliers/inquiries/:id/read", verify, inquiryController.markSupplierInquiryAsRead);
router.patch("/suppliers/inquiries/:id/reply", verify, inquiryController.replyToSupplierInquiry);
router.patch("/suppliers/inquiries/:id/close", verify, inquiryController.closeSupplierInquiry);

// admin routes
router.get("/inquiries/all", verify, verifyAdmin, inquiryController.getAllInquiries);
router.get("/inquiries/:id", verify, verifyAdmin, inquiryController.getInquiryAdminById);
router.patch("/inquiries/:id/status", verify, verifyAdmin, inquiryController.updateInquiryStatus);
router.delete("/inquiries/:id/delete", verify, verifyAdmin, inquiryController.deleteInquiry);

module.exports = router;