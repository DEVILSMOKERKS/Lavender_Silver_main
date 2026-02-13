const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authenticate = require('../middlewares/auth');
const Razorpay = require('razorpay');

// Razorpay instance (use your keys or env)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_live_RepxCmn4eqow4z',
    key_secret: process.env.RAZORPAY_SECRET_KEY || 'AeMlrWP9CoqicEcP4BzznWJw',
});

// Orders CRUD
router.get('/', orderController.getAllOrders); // List all orders (admin/user)
router.get('/user', authenticate, orderController.getUserOrders); // Get user orders (authenticated)
router.get('/:id', authenticate, orderController.getOrderById); // Get order by ID (with items) - authenticated
router.post('/', orderController.createOrder); // Create order
router.put('/:id', authenticate, orderController.updateOrder); // Update order
router.delete('/:id', authenticate, orderController.deleteOrder); // Delete order

// Payment update (Razorpay callback)
router.patch('/:id/payment', authenticate, orderController.updateOrderPayment); // Update payment status/id


// Order Items CRUD (admin only)
router.get('/items/list', orderController.getOrderItems); // List order items (optionally by order_id)
router.put('/items/:id', authenticate, orderController.updateOrderItem); // Update order item
router.delete('/items/:id', authenticate, orderController.deleteOrderItem); // Delete order item

// Create Razorpay order (no DB save)
router.post('/razorpay/create-order', orderController.createRazorpayOrder);

// Invoice generation
router.get('/:id/invoice', authenticate, orderController.generateInvoice);

module.exports = router; 