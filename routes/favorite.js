const express = require("express");
const router = express.Router();

const favoriteController = require("../controllers/favorite");
const { verify, verifyAdmin } = require("../middlewares/auth");

// user
router.get("/users/favorites", verify, favoriteController.getMyFavorites);
router.post("/users/favorites", verify, favoriteController.addFavorite);
router.delete("/users/favorites/:favoriteId", verify, favoriteController.removeFavorite);

// providers
router.get("/handymen/favorites", verify, favoriteController.getUsersWhoFavoritedHandyman);
router.get("/designers/favorites", verify, favoriteController.getUsersWhoFavoritedDesigner);
router.get("/contractors/favorites", verify, favoriteController.getUsersWhoFavoritedContractor);
router.get("/suppliers/favorites", verify, favoriteController.getUsersWhoFavoritedSupplier);

// admin
router.get("/favorites/all", verify, verifyAdmin, favoriteController.getAllFavorites);
router.get("/favorites/:id", verify, verifyAdmin, favoriteController.getFavoriteById);
router.delete("/favorites/:id/delete", verify, verifyAdmin, favoriteController.deleteFavorite);

module.exports = router;