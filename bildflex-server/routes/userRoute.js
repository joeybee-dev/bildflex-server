const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verify, verifyAdmin } = require("../auth");



// User Registration (DO NOT REVISE)
router.post("/register", userController.registerUser);


// User Authentication (DO NOT REVISE)
router.post("/login", userController.loginUser);


// Retrieve User Details (DO NOT REVISE)
router.get("/details", verify, userController.userDetails);


// Update User as Admin (DO NOT REVISE)
router.patch("/:id/set-as-admin", verify, verifyAdmin, userController.setAsAdmin);


// Update Password (DO NOT REVISE)
router.patch('/update-password', verify, verifyAdmin, userController.updatePassword);


module.exports = router;    
