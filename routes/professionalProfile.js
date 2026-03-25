const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const professionalProfileController = require("../controllers/professionalProfile");
const { verify } = require("../middlewares/auth");
const mongoose = require("mongoose");

// Register
router.post("/register", professionalProfileController.registerProfile);

// Login
router.post("/login", professionalProfileController.loginProfile);

// Upload Profile Icon
router.post(
  "/upload/profile-icon",
  upload.single("image"),
  professionalProfileController.uploadProfileIcon
);

// Own profile
router.get("/my/profile", verify, professionalProfileController.getMyProfile);
router.put("/my/update", verify, professionalProfileController.updateMyProfile);
router.delete("/my/delete", verify, professionalProfileController.deleteMyProfile);

// Private messages of logged in professional
router.get("/my/messages", verify, professionalProfileController.getMyMessages);
router.get("/my/messages/:messageId", verify, professionalProfileController.getMyMessageById);
router.delete("/my/messages/:messageId", verify, professionalProfileController.deleteMyMessage);

// Public inquiry
router.post("/inquiry/:profileId", professionalProfileController.sendInquiry);

// Reply to inquiry
router.put("/reply/:messageId", verify, professionalProfileController.replyToInquiry);

// Public professional profiles
router.get("/profess", professionalProfileController.getAllProfiles);
router.get("/profess/:profileId", professionalProfileController.getProfileById);

  
 


module.exports = router;

