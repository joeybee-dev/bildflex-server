const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verify, verifyAdmin } = require("../auth");

// [ITEM 1]Create Product (Admin only) 
router.post("/", verify, verifyAdmin, productController.createProduct);


// [ITEM 2] Retrieve all Products (Admin only) 
router.get("/all", verify, verifyAdmin, productController.getAllProducts);

// [ITEM 3] Retrieve all active Products 
router.get("/active", productController.getAllActiveProducts);

// [ITEM 4] Update Product info (Admin only) 
router.patch("/:productId/update", verify, verifyAdmin, productController.updateProduct);

// [ITEM 5] Archive Product (Admin only) 
router.patch("/:productId/archive", verify, verifyAdmin, productController.archiveProduct);

// [ITEM 6] Activate Product (Admin only) 
router.patch("/:productId/activate", verify, verifyAdmin, productController.activateProduct);

// [ITEM 7] Retrieve single Product (MUST BE LAST) 
router.get("/:productId", productController.getProduct);


// [S54-3] Search For Products By Name - Joey
router.post('/search-by-name', productController.searchForProductByName);


// [S54-4] Search For Products By Price Range - Joey
router.post('/search-by-price', productController.searchForProductByPriceRange);



module.exports = router;