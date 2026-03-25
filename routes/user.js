const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");
const { verify, verifyAdmin } = require("../middlewares/auth");

// Public
router.post("/register-user", userController.registerUser);
router.post("/login-user", userController.loginUser);

// Logged-in user
router.get("/details-user", verify, userController.getUserDetails);
router.patch("/edit-user", verify, userController.updateUser);

// Admin only
router.get("/all-users", verify, verifyAdmin, userController.getAllUsers);
router.patch("/archived-user/:userId", verify, verifyAdmin, userController.archiveUser);
router.patch("/activate-user/:userId", verify, verifyAdmin, userController.activateUser);
router.delete("/delete-user/:userId", verify, verifyAdmin, userController.deleteUser);

module.exports = router;