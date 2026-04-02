const express = require("express");
const router = express.Router();

const handymanController = require("../controllers/handyman");
const inquiryController = require("../controllers/inquiry");
const bookingController = require("../controllers/booking");
const messageController = require("../controllers/message");
const favoriteController = require("../controllers/favorite");
const { verify, verifyAdmin } = require("../middlewares/auth");

// public
router.post("/register", handymanController.registerHandyman);
router.post("/login", handymanController.loginHandyman);
router.post("/forgot-password", handymanController.forgotPassword);
router.post("/reset-password/:token", handymanController.resetPassword);

router.get("/active", handymanController.getActiveHandymen);
router.get("/featured", handymanController.getFeaturedHandymen);

// logged-in handyman
router.get("/details", verify, handymanController.getHandymanDetails);
router.get("/my-profile", verify, handymanController.getHandymanDetails);
router.patch("/update-profile", verify, handymanController.updateProfile);
router.patch("/update-photo", verify, handymanController.updatePhoto);
router.patch("/change-password", verify, handymanController.changePassword);
router.delete("/deactivate-account", verify, handymanController.deactivateOwnAccount);

// inquiries
router.get("/inquiries", verify, inquiryController.getMyHandymanInquiries);
router.get("/inquiries/:id", verify, inquiryController.getHandymanInquiryById);
router.patch("/inquiries/:id/read", verify, inquiryController.markHandymanInquiryAsRead);
router.patch("/inquiries/:id/reply", verify, inquiryController.replyToHandymanInquiry);
router.patch("/inquiries/:id/close", verify, inquiryController.closeHandymanInquiry);

// bookings
router.get("/bookings", verify, bookingController.getMyHandymanBookings);
router.get("/bookings/:id", verify, bookingController.getHandymanBookingById);
router.patch("/bookings/:id/confirm", verify, bookingController.confirmHandymanBooking);
router.patch("/bookings/:id/complete", verify, bookingController.completeHandymanBooking);
router.patch("/bookings/:id/cancel", verify, bookingController.cancelHandymanBooking);

// messages
router.get("/messages", verify, messageController.getMyHandymanMessages);
router.post("/messages", verify, messageController.sendHandymanMessage);
router.get("/messages/:id", verify, messageController.getHandymanMessageById);
router.patch("/messages/:id/read", verify, messageController.markHandymanMessageAsRead);
router.patch("/messages/:id/archive", verify, messageController.archiveHandymanMessage);

// favorites
router.get("/favorites", verify, favoriteController.getUsersWhoFavoritedHandyman);

// admin
router.get("/all", verify, verifyAdmin, handymanController.getAllHandymen);
router.get("/:id/admin", verify, verifyAdmin, handymanController.getHandymanByIdAdmin);
router.patch("/:id/account-status", verify, verifyAdmin, handymanController.updateAccountStatus);
router.patch("/:id/subscription-plan", verify, verifyAdmin, handymanController.updateSubscriptionPlan);
router.patch("/:id/feature", verify, verifyAdmin, handymanController.updateFeaturedStatus);
router.patch("/:id/archive", verify, verifyAdmin, handymanController.archiveHandyman);
router.delete("/:id/delete", verify, verifyAdmin, handymanController.deleteHandyman);

// public profile last
router.get("/:id", handymanController.getHandymanPublicProfile);

module.exports = router;