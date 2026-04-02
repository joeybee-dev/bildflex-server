const express = require("express");
const router = express.Router();

const supplierController = require("../controllers/supplier");
const inquiryController = require("../controllers/inquiry");
const bookingController = require("../controllers/booking");
const messageController = require("../controllers/message");
const favoriteController = require("../controllers/favorite");
const { verify, verifyAdmin } = require("../middlewares/auth");

// public
router.post("/register", supplierController.registerSupplier);
router.post("/login", supplierController.loginSupplier);
router.post("/forgot-password", supplierController.forgotPassword);
router.post("/reset-password/:token", supplierController.resetPassword);

router.get("/active", supplierController.getActiveSuppliers);
router.get("/featured", supplierController.getFeaturedSuppliers);

// logged-in supplier
router.get("/details", verify, supplierController.getSupplierDetails);
router.get("/my-profile", verify, supplierController.getSupplierDetails);
router.patch("/update-profile", verify, supplierController.updateProfile);
router.patch("/update-photo", verify, supplierController.updatePhoto);
router.patch("/change-password", verify, supplierController.changePassword);
router.delete("/deactivate-account", verify, supplierController.deactivateOwnAccount);

// inquiries
router.get("/inquiries", verify, inquiryController.getMySupplierInquiries);
router.get("/inquiries/:id", verify, inquiryController.getSupplierInquiryById);
router.patch("/inquiries/:id/read", verify, inquiryController.markSupplierInquiryAsRead);
router.patch("/inquiries/:id/reply", verify, inquiryController.replyToSupplierInquiry);
router.patch("/inquiries/:id/close", verify, inquiryController.closeSupplierInquiry);

// bookings
router.get("/bookings", verify, bookingController.getMySupplierBookings);
router.get("/bookings/:id", verify, bookingController.getSupplierBookingById);
router.patch("/bookings/:id/confirm", verify, bookingController.confirmSupplierBooking);
router.patch("/bookings/:id/complete", verify, bookingController.completeSupplierBooking);
router.patch("/bookings/:id/cancel", verify, bookingController.cancelSupplierBooking);

// messages
router.get("/messages", verify, messageController.getMySupplierMessages);
router.post("/messages", verify, messageController.sendSupplierMessage);
router.get("/messages/:id", verify, messageController.getSupplierMessageById);
router.patch("/messages/:id/read", verify, messageController.markSupplierMessageAsRead);

// favorites
router.get("/favorites", verify, favoriteController.getUsersWhoFavoritedSupplier);

// admin
router.get("/all", verify, verifyAdmin, supplierController.getAllSuppliers);
router.get("/:id/admin", verify, verifyAdmin, supplierController.getSupplierByIdAdmin);
router.patch("/:id/account-status", verify, verifyAdmin, supplierController.updateAccountStatus);
router.patch("/:id/subscription-plan", verify, verifyAdmin, supplierController.updateSubscriptionPlan);
router.patch("/:id/feature", verify, verifyAdmin, supplierController.updateFeaturedStatus);
router.patch("/:id/archive", verify, verifyAdmin, supplierController.archiveSupplier);
router.delete("/:id/delete", verify, verifyAdmin, supplierController.deleteSupplier);

// public profile last
router.get("/:id", supplierController.getSupplierPublicProfile);

module.exports = router;