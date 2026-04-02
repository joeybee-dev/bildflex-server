const express = require("express");
const router = express.Router();

const contractorController = require("../controllers/contractor");
const inquiryController = require("../controllers/inquiry");
const bookingController = require("../controllers/booking");
const messageController = require("../controllers/message");
const favoriteController = require("../controllers/favorite");
const { verify, verifyAdmin } = require("../middlewares/auth");

// public
router.post("/register", contractorController.registerContractor);
router.post("/login", contractorController.loginContractor);
router.post("/forgot-password", contractorController.forgotPassword);
router.post("/reset-password/:token", contractorController.resetPassword);

router.get("/active", contractorController.getActiveContractors);
router.get("/featured", contractorController.getFeaturedContractors);

// logged-in contractor
router.get("/details", verify, contractorController.getContractorDetails);
router.get("/my-profile", verify, contractorController.getContractorDetails);
router.patch("/update-profile", verify, contractorController.updateProfile);
router.patch("/update-photo", verify, contractorController.updatePhoto);
router.patch("/change-password", verify, contractorController.changePassword);
router.delete("/deactivate-account", verify, contractorController.deactivateOwnAccount);

// inquiries
router.get("/inquiries", verify, inquiryController.getMyContractorInquiries);
router.get("/inquiries/:id", verify, inquiryController.getContractorInquiryById);
router.patch("/inquiries/:id/read", verify, inquiryController.markContractorInquiryAsRead);
router.patch("/inquiries/:id/reply", verify, inquiryController.replyToContractorInquiry);
router.patch("/inquiries/:id/close", verify, inquiryController.closeContractorInquiry);

// bookings
router.get("/bookings", verify, bookingController.getMyContractorBookings);
router.get("/bookings/:id", verify, bookingController.getContractorBookingById);
router.patch("/bookings/:id/confirm", verify, bookingController.confirmContractorBooking);
router.patch("/bookings/:id/complete", verify, bookingController.completeContractorBooking);
router.patch("/bookings/:id/cancel", verify, bookingController.cancelContractorBooking);

// messages
router.get("/messages", verify, messageController.getMyContractorMessages);
router.post("/messages", verify, messageController.sendContractorMessage);
router.get("/messages/:id", verify, messageController.getContractorMessageById);
router.patch("/messages/:id/read", verify, messageController.markContractorMessageAsRead);

// favorites
router.get("/favorites", verify, favoriteController.getUsersWhoFavoritedContractor);

// admin
router.get("/all", verify, verifyAdmin, contractorController.getAllContractors);
router.get("/:id/admin", verify, verifyAdmin, contractorController.getContractorByIdAdmin);
router.patch("/:id/account-status", verify, verifyAdmin, contractorController.updateAccountStatus);
router.patch("/:id/subscription-plan", verify, verifyAdmin, contractorController.updateSubscriptionPlan);
router.patch("/:id/feature", verify, verifyAdmin, contractorController.updateFeaturedStatus);
router.patch("/:id/archive", verify, verifyAdmin, contractorController.archiveContractor);
router.delete("/:id/delete", verify, verifyAdmin, contractorController.deleteContractor);

// public profile last
router.get("/:id", contractorController.getContractorPublicProfile);

module.exports = router;