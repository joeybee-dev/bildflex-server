const mongoose = require("mongoose");
const SearchHistory = require("../models/SearchHistory");

const PROVIDER_TYPES = ["Handyman", "Designer", "Contractor", "Supplier"];

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// User: get my search history
module.exports.getMySearchHistory = async (req, res) => {
  try {
    const searchHistory = await SearchHistory.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    return res.status(200).send({ searchHistory });
  } catch (error) {
    console.error("Get my search history error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch search history."
    });
  }
};

// User: create search history
module.exports.createSearchHistory = async (req, res) => {
  try {
    const { keyword, providerType, city, province } = req.body;

    if (
      providerType !== undefined &&
      providerType !== "" &&
      !PROVIDER_TYPES.includes(providerType)
    ) {
      return res.status(400).send({ error: "Invalid provider type." });
    }

    const searchHistory = await SearchHistory.create({
      userId: req.user.id,
      keyword: keyword || "",
      providerType: providerType || "",
      city: city || "",
      province: province || ""
    });

    return res.status(201).send({
      message: "Search history saved successfully.",
      searchHistory
    });
  } catch (error) {
    console.error("Create search history error:", error);
    return res.status(500).send({
      error: error.message || "Failed to save search history."
    });
  }
};

// User: delete one search history item
module.exports.deleteSearchHistoryItem = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid search history ID." });
    }

    const deletedItem = await SearchHistory.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!deletedItem) {
      return res.status(404).send({ error: "Search history item not found." });
    }

    return res.status(200).send({
      message: "Search history item deleted successfully."
    });
  } catch (error) {
    console.error("Delete search history item error:", error);
    return res.status(500).send({
      error: error.message || "Failed to delete search history item."
    });
  }
};

// User: clear all search history
module.exports.clearSearchHistory = async (req, res) => {
  try {
    await SearchHistory.deleteMany({ userId: req.user.id });

    return res.status(200).send({
      message: "Search history cleared successfully."
    });
  } catch (error) {
    console.error("Clear search history error:", error);
    return res.status(500).send({
      error: error.message || "Failed to clear search history."
    });
  }
};

// Admin: get all search history
module.exports.getAllSearchHistory = async (req, res) => {
  try {
    const searchHistory = await SearchHistory.find()
      .populate("userId", "-password")
      .sort({ createdAt: -1 });

    return res.status(200).send({ searchHistory });
  } catch (error) {
    console.error("Get all search history error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch all search history."
    });
  }
};

// Admin: get search history by ID
module.exports.getSearchHistoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid search history ID." });
    }

    const searchHistory = await SearchHistory.findById(id)
      .populate("userId", "-password");

    if (!searchHistory) {
      return res.status(404).send({ error: "Search history not found." });
    }

    return res.status(200).send({ searchHistory });
  } catch (error) {
    console.error("Get search history by ID error:", error);
    return res.status(500).send({
      error: error.message || "Failed to fetch search history."
    });
  }
};

// Admin: delete search history by ID
module.exports.deleteSearchHistoryByAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({ error: "Invalid search history ID." });
    }

    const deletedItem = await SearchHistory.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).send({ error: "Search history not found." });
    }

    return res.status(200).send({
      message: "Search history deleted successfully."
    });
  } catch (error) {
    console.error("Delete search history by admin error:", error);
    return res.status(500).send({
      error: error.message || "Failed to delete search history."
    });
  }
};