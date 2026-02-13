const express = require('express');
const router = express.Router();
const productPriceCalculationController = require('../controllers/productPriceCalculation.controller');
const auth = require('../middlewares/auth');

// =======================================
// PRODUCT PRICE CALCULATION ROUTES
// =======================================

// Public routes (no auth required)
router.get('/affected-products', productPriceCalculationController.getAffectedProducts);
router.post('/calculate-price', productPriceCalculationController.calculateProductPriceEndpoint);

// Protected routes (auth required)
router.post('/trigger-update', auth, productPriceCalculationController.triggerProductPriceUpdate);
router.get('/price-history/:product_id', auth, productPriceCalculationController.getProductPriceHistory);

module.exports = router;
