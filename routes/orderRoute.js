const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const cartController = require("../controllers/cartController");
const { verify, verifyAdmin } = require("../auth");


// [ITEM 1] Create Order
router.post('/checkout', verify, orderController.createOrder);

// [ITEM 2] Retrieve Logged in User's Order
router.get('/my-orders', verify, orderController.retrieveUserOrder);


// [ITEM 3] Retrieve All User's Order
router.get('/all-orders', verify, verifyAdmin, orderController.retrieveAllOrders);


module.exports = router;