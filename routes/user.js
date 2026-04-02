const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");
const favoriteController = require("../controllers/favorite");
const inquiryController = require("../controllers/inquiry");
const bookingController = require("../controllers/booking");
const messageController = require("../controllers/message");
const searchHistoryController = require("../controllers/searchHistory");
const { verify, verifyAdmin } = require("../middlewares/auth");

// public
router.post("/register", userController.registerUser);
router.post("/login", userController.loginUser);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password/:token", userController.resetPassword);

// logged-in user
router.get("/details", verify, userController.getUserDetails);
router.get("/my-profile", verify, userController.getUserDetails);
router.patch("/update-profile", verify, userController.updateProfile);
router.patch("/update-photo", verify, userController.updatePhoto);
router.patch("/change-password", verify, userController.changePassword);
router.delete("/deactivate-account", verify, userController.deactivateOwnAccount);

// favorites
router.get("/favorites", verify, favoriteController.getMyFavorites);
router.post("/favorites", verify, favoriteController.addFavorite);
router.delete("/favorites/:favoriteId", verify, favoriteController.removeFavorite);

// inquiries
router.get("/my-inquiries", verify, inquiryController.getMyInquiries);
router.post("/inquiries", verify, inquiryController.createInquiry);
router.get("/inquiries/:id", verify, inquiryController.getInquiryById);

// bookings
router.get("/my-bookings", verify, bookingController.getMyBookings);
router.post("/bookings", verify, bookingController.createBooking);
router.get("/bookings/:id", verify, bookingController.getBookingById);
router.patch("/bookings/:id/cancel", verify, bookingController.cancelBooking);

// messages
router.get("/messages", verify, messageController.getMyMessages);
router.post("/messages", verify, messageController.sendMessage);
router.get("/messages/:id", verify, messageController.getMessageById);
router.patch("/messages/:id/read", verify, messageController.markMessageAsRead);

// search history
router.get("/search-history", verify, searchHistoryController.getMySearchHistory);
router.post("/search-history", verify, searchHistoryController.createSearchHistory);
router.delete("/search-history/:id", verify, searchHistoryController.deleteSearchHistoryItem);
router.delete("/search-history", verify, searchHistoryController.clearSearchHistory);

// admin
router.get("/all", verify, verifyAdmin, userController.getAllUsers);
router.get("/:id", verify, verifyAdmin, userController.getUserById);
router.patch("/:id/account-status", verify, verifyAdmin, userController.updateAccountStatus);
router.patch("/:id/subscription-plan", verify, verifyAdmin, userController.updateSubscriptionPlan);
router.patch("/:id/feature", verify, verifyAdmin, userController.updateFeaturedStatus);
router.patch("/:id/user-type", verify, verifyAdmin, userController.updateUserType);
router.patch("/:id/archive", verify, verifyAdmin, userController.archiveUser);
router.delete("/:id/delete", verify, verifyAdmin, userController.deleteUser);

module.exports = router;