const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { verify, verifyAdmin } = require("../auth");


// [ITEM 1] Retrieve User's Cart
router.get("/get-cart", verify, verifyAdmin, cartController.retrieveUserCart);


// [ITEM 2] Add To Cart
router.post("/add-to-cart", verify, cartController.addToCart);


// [ITEM 3] Change Product Quantities in Cart
router.patch("/update-cart-quantity", verify, cartController.updateCartQuantity);


// [ITEM 4] Remove Item From Cart - Thomas (s54)
router.patch("/:productId/remove-from-cart", verify, cartController.removeFromCart);

// [ITEM 5] Clear Cart - Thomas (s54)
router.put("/clear-cart", verify, cartController.clearCart);



module.exports = router;