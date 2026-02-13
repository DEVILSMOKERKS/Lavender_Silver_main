const express = require('express');
const router = express.Router();
const metalRatesController = require('../controllers/metalRates.controller');
const metalPredictionsController = require('../controllers/metalPredictions.controller');
const auth = require('../middlewares/auth');

// =======================================
// METAL RATES ROUTES
// =======================================

// Public routes (no auth required)
router.get('/metal-types', metalRatesController.getMetalTypes);
router.get('/metal-types/:metal_type_id/purities', metalRatesController.getMetalPurities);

// Metal type management (admin only)
router.post('/metal-types', auth, metalRatesController.createMetalType);
router.delete('/metal-types/:id', auth, metalRatesController.deleteMetalType);
router.get('/rates/current', metalRatesController.getCurrentRates);
router.get('/rates/latest', metalRatesController.getLatestRates);
router.get('/rates/history', metalRatesController.getRateHistory);
router.get('/stats', metalRatesController.getRateStats);
router.get('/rates/check/:metal_type_id/:purity_id', metalRatesController.checkMetalRateExists);

// Protected routes (auth required)
router.post('/rates/create', auth, metalRatesController.createMetalRate);
router.put('/rates/update', auth, metalRatesController.updateMetalRate);
router.delete('/rates/:id', auth, metalRatesController.deleteMetalRate);
router.delete('/history/:id', auth, metalRatesController.deleteRateHistory);
router.post('/cleanup', auth, metalRatesController.cleanupOrphanedData);
router.get('/api-config', auth, metalRatesController.getApiConfig);

// Live metal prices and predictions routes
router.get('/live-prices', metalRatesController.fetchLiveMetalPrices);
router.get('/predictions', metalRatesController.getMetalPricePredictions);

// Metal Predictions Routes (Public - for frontend)
router.get('/predictions/managed', metalPredictionsController.getAllPredictions);

// Get current price for metal type (for admin form)
router.get('/predictions/current-price/:metal_type', auth, metalPredictionsController.getCurrentPriceForMetal);

// Metal Predictions Routes (Admin)
router.get('/predictions/admin/all', auth, metalPredictionsController.getAllPredictionsAdmin);
router.get('/predictions/admin/:id', auth, metalPredictionsController.getPredictionById);
router.post('/predictions/admin', auth, metalPredictionsController.createPrediction);
router.put('/predictions/admin/:id', auth, metalPredictionsController.updatePrediction);
router.delete('/predictions/admin/:id', auth, metalPredictionsController.deletePrediction);

// Exchange rates route (proxy to avoid CORS)
router.get('/exchange-rates', metalRatesController.getExchangeRates);

module.exports = router; 