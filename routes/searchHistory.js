const express = require("express");
const router = express.Router();

const searchHistoryController = require("../controllers/searchHistory");
const { verify, verifyAdmin } = require("../middlewares/auth");

// user
router.get("/users/search-history", verify, searchHistoryController.getMySearchHistory);
router.post("/users/search-history", verify, searchHistoryController.createSearchHistory);
router.delete("/users/search-history/:id", verify, searchHistoryController.deleteSearchHistoryItem);
router.delete("/users/search-history", verify, searchHistoryController.clearSearchHistory);

// admin
router.get("/search-history/all", verify, verifyAdmin, searchHistoryController.getAllSearchHistory);
router.get("/search-history/:id", verify, verifyAdmin, searchHistoryController.getSearchHistoryById);
router.delete("/search-history/:id/delete", verify, verifyAdmin, searchHistoryController.deleteSearchHistoryByAdmin);

module.exports = router;