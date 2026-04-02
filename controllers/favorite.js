const mongoose = require("mongoose");
const Favorite = require("../models/Favorite");

const PROVIDER_TYPES = ["Handyman", "Designer", "Contractor", "Supplier"];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// User: get my favorites
module.exports.getMyFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .populate("userId", "-password")
      .populate("targetId")
      .sort({ createdAt: -1 });

    return res.status(200).send({ favorites });
  } catch (error) {
    console.error("Get my favorites error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch favorites."
    });
  }
};

// User: add favorite
module.exports.addFavorite = async (req, res) => {
  try {
    const { targetId, targetType } = req.body;

    if (!targetId || !targetType) {
      return res.status(400).send({
        error: "Target ID and target type are required."
      });
    }

    if (!isValidObjectId(targetId)) {
      return res.status(400).send({ error: "Invalid target ID." });
    }

    if (!PROVIDER_TYPES.includes(targetType)) {
      return res.status(400).send({ error: "Invalid target type." });
    }

    const existingFavorite = await Favorite.findOne({
      userId: req.user.id,
      targetId,
      targetType
    });

    if (existingFavorite) {
      return res.status(409).send({
        error: "This provider is already in your favorites."
      });
    }

    const favorite = await Favorite.create({
      userId: req.user.id,
      targetId,
      targetType
    });

    return res.status(201).send({
      message: "Favorite added successfully.",
      favorite
    });
  } catch (error) {
    console.error("Add favorite error:", error);

    if (error.code === 11000) {
      return res.status(409).send({
        error: "This provider is already in your favorites."
      });
    }

    return res.status(500).send({
      error: error.message || "Failed to add favorite."
    });
  }
};

// User: remove favorite
module.exports.removeFavorite = async (req, res) => {
  try {
    const { favoriteId } = req.params;

    if (!isValidObjectId(favoriteId)) {
      return res.status(400).send({ error: "Invalid favorite ID." });
    }

    const favorite = await Favorite.findOneAndDelete({
      _id: favoriteId,
      userId: req.user.id
    });

    if (!favorite) {
      return res.status(404).send({ error: "Favorite not found." });
    }

    return res.status(200).send({
      message: "Favorite removed successfully."
    });
  } catch (error) {
    console.error("Remove favorite error:", error);
    return res.status(500).send({
      error: error.message || "Failed to remove favorite."
    });
  }
};

// Shared provider helper
const getUsersWhoFavoritedProvider = async (req, res, targetType) => {
  try {
    const favorites = await Favorite.find({
      targetId: req.user.id,
      targetType
    })
      .populate("userId", "-password")
      .sort({ createdAt: -1 });

    return res.status(200).send({
      totalFavorites: favorites.length,
      favorites
    });
  } catch (error) {
    console.error(`Get users who favorited ${targetType} error:`, error);
    return res.status(500).send({
      error: error.message || `Failed to fetch ${targetType.toLowerCase()} favorites.`
    });
  }
};

// Handyman
module.exports.getUsersWhoFavoritedHandyman = async (req, res) =>
  getUsersWhoFavoritedProvider(req, res, "Handyman");

// Designer
module.exports.getUsersWhoFavoritedDesigner = async (req, res) =>
  getUsersWhoFavoritedProvider(req, res, "Designer");

// Contractor
module.exports.getUsersWhoFavoritedContractor = async (req, res) =>
  getUsersWhoFavoritedProvider(req, res, "Contractor");

// Supplier
module.exports.getUsersWhoFavoritedSupplier = async (req, res) =>
  getUsersWhoFavoritedProvider(req, res, "Supplier");

// Admin: get all favorites
module.exports.getAllFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find()
      .populate("userId", "-password")
      .populate("targetId")
      .sort({ createdAt: -1 });

    return res.status(200).send({ favorites });
  } catch (error) {
    console.error("Get all favorites error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch favorites."
    });
  }
};

// Admin: get favorite by ID
module.exports.getFavoriteById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid favorite ID." });
    }

    const favorite = await Favorite.findById(id)
      .populate("userId", "-password")
      .populate("targetId");

    if (!favorite) {
      return res.status(404).send({ error: "Favorite not found." });
    }

    return res.status(200).send({ favorite });
  } catch (error) {
    console.error("Get favorite by ID error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch favorite."
    });
  }
};

// Admin: delete favorite
module.exports.deleteFavorite = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid favorite ID." });
    }

    const deletedFavorite = await Favorite.findByIdAndDelete(id);

    if (!deletedFavorite) {
      return res.status(404).send({ error: "Favorite not found." });
    }

    return res.status(200).send({
      message: "Favorite deleted successfully."
    });
  } catch (error) {
    console.error("Delete favorite error:", error);
    return res.status(500).send({
      error: error.message || "Failed to delete favorite."
    });
  }
};