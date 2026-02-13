const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const auth = require('../middlewares/auth');

// =======================================
// CART ROUTES
// =======================================

// Get user's cart
router.get('/cart', auth, cartController.getUserCart);

// Add item to cart
router.post('/cart', auth, cartController.addToCart);

// Update cart item
router.put('/cart/:cart_item_id', auth, cartController.updateCartItem);

// Remove item from cart
router.delete('/cart/:cart_item_id', auth, cartController.removeFromCart);

// Clear user's cart
router.delete('/cart', auth, cartController.clearCart);

// Get cart summary
router.get('/cart/summary', auth, cartController.getCartSummary);

// Move item from wishlist to cart
router.post('/cart/from-wishlist/:wishlist_item_id', auth, cartController.moveFromWishlistToCart);

// =======================================
// ADMIN CART ROUTES
// =======================================

// Get all user carts (admin only)
router.get('/admin/carts', auth, cartController.getAllUserCarts);

// Get specific user cart (admin only)
router.get('/admin/carts/:user_id', auth, cartController.getUserCartByAdmin);

// Send invoice to user (admin only)
router.post('/admin/carts/:user_id/send-invoice', auth, cartController.sendInvoiceToUser);

// Remove cart item (admin only)
router.delete('/admin/carts/:cart_item_id', auth, cartController.removeCartItemByAdmin);

module.exports = router; 