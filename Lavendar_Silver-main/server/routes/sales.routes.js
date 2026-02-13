const express = require('express');
const router = express.Router();
const salesController = require('../controllers/sales.controller');
const auth = require('../middlewares/auth');

// Get most selling products with monthly breakdown
router.get('/most-selling-products',auth, salesController.getMostSellingProducts);

// Get most selling locations with monthly breakdown
router.get('/most-selling-locations',auth, salesController.getMostSellingLocations);

// Get comprehensive sales dashboard data
router.get('/dashboard',auth, salesController.getSalesDashboard);

// Get sales comparison between periods
router.get('/comparison',auth, salesController.getSalesComparison);

module.exports = router; 