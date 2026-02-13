const express = require('express');
const router = express.Router();
const digitalGoldController = require('../controllers/digitalGold.controller');
const auth = require('../middlewares/auth');

// =======================================
// DIGITAL GOLD ROUTES
// =======================================

// Public routes (no auth required)
router.get('/metal-types-purities', digitalGoldController.getMetalTypesAndPurities);
router.get('/stats', digitalGoldController.getDigitalGoldStats);
// Transactions route - uses optional auth to allow filtering by user_id for authenticated users
router.get('/transactions', auth.optionalAuth, digitalGoldController.getDigitalGoldTransactions);

router.get('/rate-trend', digitalGoldController.getRateTrendData);
router.get('/forecast', digitalGoldController.getForecastData);

// Protected routes (auth required)
router.post('/transactions', auth, digitalGoldController.createDigitalGoldTransaction);
router.put('/transactions/:id/status', auth, digitalGoldController.updateTransactionStatus);
router.delete('/transactions/:id', auth, digitalGoldController.deleteTransaction);

// Razorpay routes
router.post('/create-order', auth, digitalGoldController.createRazorpayOrder);
router.post('/verify-payment', auth, digitalGoldController.verifyRazorpayPayment);

// User routes
router.get('/user/:id', auth, digitalGoldController.getUserById);
router.get('/transactions/user/:user_id', auth, digitalGoldController.getUserTransactions);

// Sell functionality routes
router.get('/holdings/:user_id', auth, digitalGoldController.getUserHoldings);
router.post('/sell', auth, digitalGoldController.createSellTransaction);
router.post('/sell/:transaction_id/confirm', auth, digitalGoldController.confirmSellTransaction);
router.post('/sell/:transaction_id/process', auth, digitalGoldController.processSellTransaction);

module.exports = router; 