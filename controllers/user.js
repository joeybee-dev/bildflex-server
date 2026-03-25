const User = require("../models/User");
const bcrypt = require("bcryptjs");
const auth = require("../middlewares/auth");

// Register user
module.exports.registerUser = async (req, res) => {
  try {
    console.log("register req.body:", req.body);

    const { firstName, gender, email, city, country, password } = req.body;

    if (!firstName || !gender || !email || !city || !password) {
      return res.status(400).send({
        error: "First name, gender, email, city, and password are required."
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).send({
        error: "Email is already registered."
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const newUser = new User({
      firstName: String(firstName).trim(),
      gender: String(gender).trim(),
      email: normalizedEmail,
      city: String(city).trim(),
      country: country ? String(country).trim() : "Philippines",
      password: hashedPassword
    });

    const savedUser = await newUser.save();

    return res.status(201).send({
      message: "User registered successfully.",
      user: {
        _id: savedUser._id,
        firstName: savedUser.firstName,
        fullName: savedUser.fullName,
        gender: savedUser.gender,
        email: savedUser.email,
        city: savedUser.city,
        country: savedUser.country,
        userType: savedUser.userType
      }
    });
  } catch (err) {
    console.error("Register user error:", err);

    if (err.code === 11000) {
      return res.status(409).send({
        error: "Email is already registered."
      });
    }

    if (err.name === "ValidationError") {
      return res.status(400).send({
        error: Object.values(err.errors)
          .map((e) => e.message)
          .join(", ")
      });
    }

    return res.status(500).send({
      error: err.message || "Failed to register user."
    });
  }
};


// Login user
module.exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      return res.status(401).send({
        error: "Invalid email or password."
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).send({
        error: "Invalid email or password."
      });
    }

    if (user.isArchived) {
      return res.status(403).send({
        error: "This account is archived."
      });
    }

    const token = auth.createAccessToken(user);

    return res.status(200).send({
      message: "Login successful.",
      access: token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        userType: user.userType,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error("Login user error:", err);
    return res.status(500).send({
      error: "Failed to login."
    });
  }
};

// Get logged-in user details
module.exports.getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    return res.status(200).send({
      user
    });
  } catch (err) {
    console.error("Get user details error:", err);
    return res.status(500).send({
      error: "Failed to fetch user details."
    });
  }
};

// Get all users (admin only)
module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).send({
      users
    });
  } catch (err) {
    console.error("Get all users error:", err);
    return res.status(500).send({
      error: "Failed to fetch users."
    });
  }
};

// Delete user (admin only)
module.exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    return res.status(200).send({
      message: "User deleted successfully."
    });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).send({
      error: "Failed to delete user."
    });
  }
};

// Get specific logged-in user
module.exports.getSpecificUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("favorites");

    if (!user) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    return res.status(200).send({
      user
    });
  } catch (err) {
    console.error("Get specific user error:", err);
    return res.status(500).send({
      error: "Failed to fetch user."
    });
  }
};

// Update specific logged-in user
module.exports.updateSpecificUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    const {
      profilePhoto,
      firstName,
      lastName,
      gender,
      birthYear,
      email,
      mobileNo,
      city,
      province,
      country,
      bio,
      notificationSettings
    } = req.body;

    // Check duplicate email if user changes email
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser) {
        return res.status(409).send({
          error: "Email is already in use."
        });
      }
    }

    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (gender !== undefined) user.gender = gender;
    if (birthYear !== undefined) user.birthYear = birthYear;
    if (email !== undefined) user.email = email.toLowerCase();
    if (mobileNo !== undefined) user.mobileNo = mobileNo;
    if (city !== undefined) user.city = city;
    if (province !== undefined) user.province = province;
    if (country !== undefined) user.country = country;
    if (bio !== undefined) user.bio = bio;

    if (notificationSettings) {
      user.notificationSettings = {
        ...user.notificationSettings.toObject(),
        ...notificationSettings
      };
    }

    const updatedUser = await user.save();

    return res.status(200).send({
      message: "User updated successfully.",
      user: {
        ...updatedUser.toObject(),
        password: undefined
      }
    });
  } catch (err) {
    console.error("Update specific user error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).send({
        error: Object.values(err.errors).map(e => e.message).join(", ")
      });
    }

    return res.status(500).send({
      error: "Failed to update user."
    });
  }
};

// Archive specific logged-in user
module.exports.archivedSpecificUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    user.isArchived = true;

    const updatedUser = await user.save();

    return res.status(200).send({
      message: "User archived successfully.",
      user: {
        ...updatedUser.toObject(),
        password: undefined
      }
    });
  } catch (err) {
    console.error("Archive specific user error:", err);
    return res.status(500).send({
      error: "Failed to archive user."
    });
  }
};

// Activate specific logged-in user
module.exports.activateSpecificUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).send({
        error: "User not found."
      });
    }

    user.isArchived = false;
    user.isActive = true;
    user.accountStatus = "active";

    const updatedUser = await user.save();

    return res.status(200).send({
      message: "User activated successfully.",
      user: {
        ...updatedUser.toObject(),
        password: undefined
      }
    });
  } catch (err) {
    console.error("Activate specific user error:", err);
    return res.status(500).send({
      error: "Failed to activate user."
    });
  }
};