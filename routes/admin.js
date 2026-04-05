const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin");
const { verify, verifyAdmin } = require("../middlewares/auth");

// dashboard
router.get("/dashboard-counts", verify, verifyAdmin, adminController.getDashboardCounts);

// account management
router.get("/users", verify, verifyAdmin, adminController.getAllUsers);
router.get("/handymen", verify, verifyAdmin, adminController.getAllHandymen);
router.get("/designers", verify, verifyAdmin, adminController.getAllDesigners);
router.get("/contractors", verify, verifyAdmin, adminController.getAllContractors);
router.get("/suppliers", verify, verifyAdmin, adminController.getAllSuppliers);

// operations
router.get("/inquiries", verify, verifyAdmin, adminController.getAllInquiries);
router.get("/bookings", verify, verifyAdmin, adminController.getAllBookings);
router.get("/messages", verify, verifyAdmin, adminController.getAllMessages);

// status updates
router.patch("/users/:userId/status", verify, verifyAdmin, adminController.updateUserStatus);
router.patch("/:providerType/:providerId/status", verify, verifyAdmin, adminController.updateProviderStatus);

module.exports = router;