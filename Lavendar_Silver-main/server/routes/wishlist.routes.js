const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist.controller');
const auth = require('../middlewares/auth');

// =======================================
// WISHLIST ROUTES
// =======================================


// Get user's wishlist
router.get('/wishlist', auth, wishlistController.getUserWishlist);

// Add item to wishlist
router.post('/wishlist', auth, wishlistController.addToWishlist);

// Update wishlist item
router.put('/wishlist/:wishlist_item_id', auth, wishlistController.updateWishlistItem);

// Remove item from wishlist
router.delete('/wishlist/:wishlist_item_id', auth, wishlistController.removeFromWishlist);

// Clear user's wishlist
router.delete('/wishlist', auth, wishlistController.clearWishlist);

// Check if product is in wishlist
router.get('/wishlist/check/:product_id', auth, wishlistController.checkWishlistStatus);

// Move item from cart to wishlist
router.post('/wishlist/from-cart/:cart_item_id', auth, wishlistController.moveFromCartToWishlist);

// Get wishlist summary
router.get('/wishlist/summary', auth, wishlistController.getWishlistSummary);

// =======================================
// ADMIN WISHLIST MONITORING ROUTES
// =======================================

// Get wishlist monitoring data (admin only)
router.get('/admin/wishlist-monitoring', auth, wishlistController.getWishlistMonitoringData);

// Get available categories for wishlist monitoring (admin only)
router.get('/admin/wishlist-monitoring/categories', auth, wishlistController.getWishlistMonitoringCategories);

// Export wishlist monitoring data (admin only)
router.get('/admin/wishlist-monitoring/export', auth, wishlistController.exportWishlistMonitoringData);

module.exports = router; 