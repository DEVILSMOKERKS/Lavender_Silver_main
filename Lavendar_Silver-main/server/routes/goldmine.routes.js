const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');
const {
  createSubscription,
  savePersonalDetails,
  saveNomineeDetails,
  createRazorpaySubscription,
  getSubscriptionDetails,
  getUserSubscriptions,
  updatePaymentStatus,
  markMonthlyPayment,
  getUserTotalPaidAmount,
  createMonthlyPaymentOrder,
  verifyMonthlyPayment,
  // Plan Controller Center APIs
  getPlanControllerStats,
  getUserInstallmentDetails,
  getEarlyRedemptionRequests,
  approveEarlyRedemption,
  deletePlanItem,
  exportPlanReport,
  cleanupDuplicateSubscriptions
} = require('../controllers/goldmine.controller');


// Create new subscription
router.post('/create', auth, createSubscription);

// Save personal details
router.post('/personal-details', auth, savePersonalDetails);

// Save nominee details
router.post('/nominee-details', auth, saveNomineeDetails);

// Create Razorpay subscription
router.post('/create-razorpay', auth, createRazorpaySubscription);

// Get subscription details
router.get('/subscription/:subscriptionId', auth, getSubscriptionDetails);

// Get user's subscriptions
router.get('/user-subscriptions', auth, getUserSubscriptions);

// Update payment status
router.post('/update-payment-status', auth, updatePaymentStatus);

// Get user's total paid amount
router.get('/user-total-paid-amount', auth, getUserTotalPaidAmount);

// Create monthly payment order with Razorpay
router.post('/create-monthly-payment-order', auth, createMonthlyPaymentOrder);

// Verify monthly payment with Razorpay
router.post('/verify-monthly-payment', auth, verifyMonthlyPayment);

// ========================================
// PLAN CONTROLLER CENTER - ADMIN ROUTES
// ========================================

// Get plan controller dashboard statistics
router.get('/admin/plan-stats', auth, requireRole('admin'), getPlanControllerStats);

// Get user installment details with search and filter
router.get('/admin/installments', auth, requireRole('admin'), getUserInstallmentDetails);

// Get early redemption requests with search and filter
router.get('/admin/redemptions', auth, requireRole('admin'), getEarlyRedemptionRequests);

// Approve early redemption request
router.put('/admin/redemptions/:redemptionId/approve', auth, requireRole('admin'), approveEarlyRedemption);

// Delete subscription or redemption (admin action)
router.delete('/admin/:type/:id', auth, requireRole('admin'), deletePlanItem);

// Export full plan report
router.get('/admin/export-report', auth, requireRole('admin'), exportPlanReport);

// Clean up duplicate subscriptions
router.post('/admin/cleanup-duplicates', auth, requireRole('admin'), cleanupDuplicateSubscriptions);

// Mark monthly payment as received (admin)
router.post('/admin/mark-monthly-payment', auth, requireRole('admin'), markMonthlyPayment);


module.exports = router; 