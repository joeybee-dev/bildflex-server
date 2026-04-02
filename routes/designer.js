const express = require("express");
const router = express.Router();

const designerController = require("../controllers/designer");
const inquiryController = require("../controllers/inquiry");
const bookingController = require("../controllers/booking");
const messageController = require("../controllers/message");
const favoriteController = require("../controllers/favorite");
const { verify, verifyAdmin } = require("../middlewares/auth");

// public
router.post("/register", designerController.registerDesigner);
router.post("/login", designerController.loginDesigner);
router.post("/forgot-password", designerController.forgotPassword);
router.post("/reset-password/:token", designerController.resetPassword);

router.get("/active", designerController.getActiveDesigners);
router.get("/featured", designerController.getFeaturedDesigners);

// logged-in designer
router.get("/details", verify, designerController.getDesignerDetails);
router.get("/my-profile", verify, designerController.getDesignerDetails);
router.patch("/update-profile", verify, designerController.updateProfile);
router.patch("/update-photo", verify, designerController.updatePhoto);
router.patch("/change-password", verify, designerController.changePassword);
router.delete("/deactivate-account", verify, designerController.deactivateOwnAccount);

// inquiries
router.get("/inquiries", verify, inquiryController.getMyDesignerInquiries);
router.get("/inquiries/:id", verify, inquiryController.getDesignerInquiryById);
router.patch("/inquiries/:id/read", verify, inquiryController.markDesignerInquiryAsRead);
router.patch("/inquiries/:id/reply", verify, inquiryController.replyToDesignerInquiry);
router.patch("/inquiries/:id/close", verify, inquiryController.closeDesignerInquiry);

// bookings
router.get("/bookings", verify, bookingController.getMyDesignerBookings);
router.get("/bookings/:id", verify, bookingController.getDesignerBookingById);
router.patch("/bookings/:id/confirm", verify, bookingController.confirmDesignerBooking);
router.patch("/bookings/:id/complete", verify, bookingController.completeDesignerBooking);
router.patch("/bookings/:id/cancel", verify, bookingController.cancelDesignerBooking);

// messages
router.get("/messages", verify, messageController.getMyDesignerMessages);
router.post("/messages", verify, messageController.sendDesignerMessage);
router.get("/messages/:id", verify, messageController.getDesignerMessageById);
router.patch("/messages/:id/read", verify, messageController.markDesignerMessageAsRead);

// favorites
router.get("/favorites", verify, favoriteController.getUsersWhoFavoritedDesigner);

// admin
router.get("/all", verify, verifyAdmin, designerController.getAllDesigners);
router.get("/:id/admin", verify, verifyAdmin, designerController.getDesignerByIdAdmin);
router.patch("/:id/account-status", verify, verifyAdmin, designerController.updateAccountStatus);
router.patch("/:id/subscription-plan", verify, verifyAdmin, designerController.updateSubscriptionPlan);
router.patch("/:id/feature", verify, verifyAdmin, designerController.updateFeaturedStatus);
router.patch("/:id/archive", verify, verifyAdmin, designerController.archiveDesigner);
router.delete("/:id/delete", verify, verifyAdmin, designerController.deleteDesigner);

// public profile last
router.get("/:id", designerController.getDesignerPublicProfile);

module.exports = router;