const Product = require('../models/Product');


// [ITEM 1] Create Product (Admin only) (WORKING DO NOT REVISE)
module.exports.createProduct = (req, res) => {
    
    const newProduct = new Product({
        name: req.body.name,
        description: req.body.description,
        price: req.body.price
    });
    
    return newProduct.save()
        .then(savedProduct => {
            return res.status(201).send(savedProduct);
        })
        .catch(err => errorHandler(err, req, res));
};


// [ITEM 2] Retrieve all Products (Admin only) (WORKING DO NOT REVISE)
module.exports.getAllProducts = (req, res) => {
    return Product.find({})
        .then(products => {
            return res.status(200).send(products);
        })
        .catch(err => errorHandler(err, req, res));
};


// [ITEM 3 ]Retrieve all active Products (WORKING DO NOT REVISE)
module.exports.getAllActiveProducts = (req, res) => {
    return Product.find({ isActive: true })
        .then(products => {
            return res.status(200).send(products);
        })
        .catch(err => errorHandler(err, req, res));
};


// [ITEM 4]Retrieve single Product (WORKING DO NOT REVISE)
module.exports.getProduct = (req, res) => {
    return Product.findById(req.params.productId)
        .then(product => {
            
            // Product not found
            if (!product) {
                return res.status(404).send({
                    error: "Product not found"
                });
            }
            
            return res.status(200).send({
                product: product
            });
        })
        .catch(err => errorHandler(err, req, res));
};


// [ITEM 5] Update Product info (Admin only) (WORKING DO NOT REVISE)
module.exports.updateProduct = (req, res) => {
    return Product.findById({_id: req.params.productId})
        .then(product => {
            
            // Product not found
            if (!product) {
                return res.status(404).send({
                    error: "Product not found"
                });
            }
            
            // Update Product
            product.name = req.body.name;
            product.description = req.body.description;
            product.price = req.body.price;
            
            return product.save()
                .then(updatedProduct => {
                    return res.status(200).send({
                        message: "Product updated successfully",
                        updatedProduct: updatedProduct
                    });
                });
        })
        .catch(err => errorHandler(err, req, res));
};


// [ITEM 6]Archive Product (Admin only) (WORKING DO NOT REVISE)
module.exports.archiveProduct = (req, res) => {
    return Product.findById({_id: req.params.productId})
        .then(product => {
            
            // Product not found
            if (!product) {
                return res.status(404).send({
                    error: "Product not found"
                });
            }
            
            // Archive Product
            product.isActive = false;
            
            return product.save()
                .then(archivedProduct => {
                    return res.status(200).send({
                        message: "Product archived successfully",
                        archivedProduct: archivedProduct
                    });
                });
        })
        .catch(err => errorHandler(err, req, res));
};


// [ITEM 7] Activate Product (Admin only) (WORKING DO NOT REVISE)
module.exports.activateProduct = (req, res) => {
    return Product.findById({_id: req.params.productId})
        .then(product => {
            
            // Product not found
            if (!product) {
                return res.status(404).send({
                    error: "Product not found"
                });
            }
            
            // Activate Product
            product.isActive = true;
            
            return product.save()
                .then(activatedProduct => {
                    return res.status(200).send({
                        message: "Product activated successfully",
                        activatedProduct: activatedProduct
                    });
                });
        })
        .catch(err => errorHandler(err, req, res));
};



// [S54-3] Search For Products By Name
module.exports.searchForProductByName = (req, res) => {
    return Product.findOne({ name: req.body.name })
    .then(product => {
        
        if (!product){
            return res.status(404).send({
                error: "Product not found"
            });

        } else {
            return res.status(200).send(product);
        }
    })
    .catch(err => errorHandler(err, req, res));  
};



// [S54-4] Search For Products By Price Range - Joey
module.exports.searchForProductByPriceRange = (req, res) => {
    const { minPrice, maxPrice } = req.body;

    return Product.find({
        price: {
            $gte: minPrice,
            $lte: maxPrice
        }
    })
    .then(products => {
        if (products.length === 0) {
            return res.status(404).send({
                message: "No products found in this price range"
            });
        }

        return res.status(200).send(products);
    })
    .catch(err => errorHandler(err, req, res));
};

