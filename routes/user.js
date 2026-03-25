const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");
const { verify, verifyAdmin } = require("../middlewares/auth");

// Register user
router.post("/register-user", userController.registerUser);

// Login user
router.post("/login-user", userController.loginUser);

// Get logged-in user details
router.get("/details-user", verify, userController.getUserDetails);

// Get all users (admin only)
router.get("/getAllUsers", verify, verifyAdmin, userController.getAllUsers);

// Delete user (admin only)
router.delete("/deleteUser/:userId", verify, verifyAdmin, userController.deleteUser);

// Get specific logged-in user
router.get("/getSpecificUser", verify, userController.getSpecificUser);

// Update specific logged-in user
router.put("/updateSpecificUser", verify, userController.updateSpecificUser);

// Archive specific logged-in user
router.patch("/archivedSpecificUser", verify, userController.archivedSpecificUser);

// Activate specific logged-in user
router.patch("/activateSpecificUser", verify, userController.activateSpecificUser);

module.exports = router;