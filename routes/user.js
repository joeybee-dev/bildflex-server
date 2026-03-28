const express = require("express");
const router = express.Router();


const userController = require("../controllers/user");
const { verify, verifyAdmin } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// Public
router.post("/register-user", userController.registerUser);
router.post("/login-user", userController.loginUser);
router.post("/forgot-password-user", userController.forgotPasswordUser);
router.post("/reset-password-user/:token", userController.resetPasswordUser);

// Logged-in user
router.get("/details-user", verify, userController.getUserDetails);
router.patch("/edit-user", verify, userController.updateUser);
router.post("/upload-photo", verify, upload.single("image"), userController.uploadUserPhoto);

// Admin only
router.get("/all-users", verify, verifyAdmin, userController.getAllUsers);
router.get("/specific-user/:userId", verify, verifyAdmin, userController.getSpecificUser);
router.patch("/archived-user/:userId", verify, verifyAdmin, userController.archiveUser);
router.patch("/activate-user/:userId", verify, verifyAdmin, userController.activateUser);
router.delete("/delete-user/:userId", verify, verifyAdmin, userController.deleteUser);


module.exports = router;