const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const auth = require('../middlewares/auth');


router.get('/dashboard/stats', auth, dashboardController.getStats);
router.get('/dashboard/sales-overview', auth, dashboardController.getSalesOverview);
router.get('/dashboard/payment-status', auth, dashboardController.getPaymentStatus);
router.get('/orders', auth, dashboardController.getRecentOrders);
router.get('/orders/:id', auth, dashboardController.getOrderDetails);
router.get('/products/performance', auth, dashboardController.getProductPerformance);
router.get('/consultations', auth, dashboardController.getUpcomingConsultations);
router.get('/support-tickets', auth, dashboardController.getSupportTickets);

module.exports = router; 