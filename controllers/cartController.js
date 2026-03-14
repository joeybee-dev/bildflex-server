const Cart = require('../models/Cart');


// [ITEM 1] Retrieve User's Cart
module.exports.retrieveUserCart = (req, res) => {
    return Cart.findOne({ userId: req.user.id })
        .then(cart => {
            if (!cart) {
                return res.status(404).send({
                    message: "No cart found"
                });
            }

            return res.status(200).send({
                cart: cart
            });
        })
        .catch(err => errorHandler(err, req, res));
};



// [ITEM 2] Add To Cart
module.exports.addToCart = (req, res) => {
    return Cart.findOne({ userId: req.user.id })
        .then(cart => {
            
            // No existing cart - create new cart
            if (!cart) {
                const newCart = new Cart({
                    userId: req.user.id,
                    cartItems: [{
                        productId: req.body.productId,
                        quantity: req.body.quantity,
                        subtotal: req.body.subtotal
                    }],
                    totalPrice: req.body.subtotal
                });
                
                return newCart.save()
                    .then(savedCart => {
                        return res.status(201).send({
                            message: "Item added to cart successfully",
                            cart: savedCart
                        });
                    })
            }
            // Check if product already exists in cart
            const existingItem = cart.cartItems.find(
                item => item.productId.toString() === req.body.productId
            );
            
            if (existingItem) {
                // Update existing item - replace with new values from request body
                existingItem.quantity = req.body.quantity;
                existingItem.subtotal = req.body.subtotal;
            } else {
                // Add new item
                cart.cartItems.push({
                    productId: req.body.productId,
                    quantity: req.body.quantity,
                    subtotal: req.body.subtotal
                });
            }
            
            // Update totalPrice
            cart.totalPrice = cart.cartItems.reduce((total, item) => total + item.subtotal, 0);
            
            return cart.save()
                .then(updatedCart => {
                    return res.status(200).send({
                        message: "Item added to cart successfully",
                        cart: updatedCart
                    });
                })
                .catch(err => errorHandler(err, req, res));

        })
        .catch(err => errorHandler(err, req, res));
};



// [ITEM 3] Change Product Quantities in Cart
module.exports.updateCartQuantity = (req, res) => {
    return Cart.findOne({ userId: req.user.id })
        .then(cart => {
            
            // Cart not found
            if (!cart) {
                return res.status(404).send({
                    message: "Cart not found"
                });
            }
            
            // Find the item in cart
            const existingItem = cart.cartItems.find(
                item => item.productId.toString() === req.body.productId
            );
            
            // Item not found in cart
            if (!existingItem) {
                return res.status(404).send({
                    message: "Item not found in cart"
                });
            }
            
            // Update quantity and subtotal
            const pricePerUnit = existingItem.subtotal / existingItem.quantity;
            existingItem.quantity = req.body.newQuantity;
            existingItem.subtotal = pricePerUnit * req.body.newQuantity;
            
            // Update totalPrice
            cart.totalPrice = cart.cartItems.reduce((total, item) => total + item.subtotal, 0);
            
            return cart.save()
                .then(updatedCart => {
                    return res.status(200).send({
                        message: "Cart updated successfully",
                        cart: updatedCart
                    });
                })
                .catch(err => errorHandler(err, req, res));
        })
        .catch(err => errorHandler(err, req, res));
};


// [ITEM 4] Remove Item From Cart - Thomas (s54)
module.exports.removeFromCart = (req, res) => {
    return Cart.findOne({ _id: req.user.id })
        .then(cart => {
            
            // Cart not found
            if (!cart) {
                return res.status(404).send({
                    message: "Cart not found"
                });
            }
            
            // Find the item in cart
            const itemIndex = cart.cartItems.findIndex(
                item => item.productId.toString() === req.params.productId
            );
            
            // Item not found in cart
            if (itemIndex === -1) {
                return res.status(404).send({
                    message: "Item not found in cart"
                });
            }
            
            // Remove the product from cartItems
            cart.cartItems.splice(itemIndex, 1);
            
            // Update totalPrice
            cart.totalPrice = cart.cartItems.reduce((total, item) => total + item.subtotal, 0);
            
            return cart.save()
                .then(updatedCart => {
                    return res.status(200).send({
                        message: "Item removed from cart successfully",
                        cart: updatedCart
                    });
                })
                .catch(err => errorHandler(err, req, res));
        })
        .catch(err => errorHandler(err, req, res));
};


// [ITEM 5] Clear Cart - Thomas (s54)
module.exports.clearCart = (req, res) => {
    return Cart.findOne({ userId: req.user.id })
        .then(cart => {
            
            // Cart not found
            if (!cart) {
                return res.status(404).send({
                    message: "Cart not found"
                });
            }
            
            // Check if cartItems is empty
            if (cart.cartItems.length === 0) {
                return res.status(200).send({
                    message: "Cart is already empty"
                });
            }
            
            // Remove all items from cartItems
            cart.cartItems = [];
            cart.totalPrice = 0;
            
            return cart.save()
                .then(updatedCart => {
                    return res.status(200).send({
                        message: "Cart cleared successfully",
                        cart: updatedCart
                    });
                })
                .catch(err => errorHandler(err, req, res));
        })
        .catch(err => errorHandler(err, req, res));
};
