const Order = require('../models/Order');
const Cart = require('../models/Cart');


// [ITEM 1] Create Order
module.exports.createOrder = (req, res) => {
    return Cart.findOne({ userId: req.user.id })
        .then(cart => {

            // No cart found
            if (!cart) {
                return res.status(404).send({
                    message: "No cart found"
                });
            }

            // Cart is empty
            if (cart.cartItems.length === 0) {
                return res.status(400).send({
                    message: "Your cart is empty"
                });
            }

            const newOrder = new Order({
                userId: req.user.id,
                productsOrdered: cart.cartItems,
                totalPrice: cart.totalPrice
            });

            return newOrder.save()
                .then(order => {
                    return res.status(201).send({
                        message: "New order created",
                        order: order
                    });
                });

        })
        .catch(err => errorHandler(err, req, res));
};


// [ITEM 2] Retrieve Logged in User's Order
module.exports.retrieveUserOrder = (req, res) => {
    return Order.find({ userId: req.user.id })
    .then(result => {

        // No order found
        if (result.length === 0) {
            return res.status(404).send({
                message: "No order found"
            });
        }

        // Show orders of login user
        return res.status(200).send(result);

    })
    .catch(err => errorHandler(err, req, res));
};



// [ITEM 3] Retrieve All User's Order
module.exports.retrieveAllOrders = (req, res) => {
    return Order.find({})
        .then(orders => {

            if (orders.length === 0) {
                return res.status(404).send({
                    message: "There are no orders"
                });
            }

            return res.status(200).send(orders);

        })
        .catch(err => errorHandler(err, req, res));
};

