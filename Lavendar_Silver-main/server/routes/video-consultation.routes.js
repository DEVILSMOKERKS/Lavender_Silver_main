const express = require('express');
const router = express.Router();
const videoConsultationController = require('../controllers/video-consultation.controller');
const auth = require('../middlewares/auth');

// Public routes (for users) - with optional auth for logged-in users
router.post('/request', auth.optionalAuth, videoConsultationController.createConsultationRequest);
router.post('/verify-otp', videoConsultationController.verifyOTP);
router.get('/user-requests', auth, videoConsultationController.getUserConsultationRequests);
router.put('/user-requests/:id/cancel', auth, videoConsultationController.cancelUserConsultation);

// Admin routes (protected)
router.get('/admin/requests', auth, videoConsultationController.getAllConsultationRequests);
router.get('/admin/requests/:id', auth, videoConsultationController.getConsultationRequestById);
router.put('/admin/requests/:id/status', auth, videoConsultationController.updateConsultationStatus);
router.put('/admin/requests/:id/notes', auth, videoConsultationController.updateAdminNotes);
router.delete('/admin/requests/:id', auth, videoConsultationController.deleteConsultationRequest);
router.get('/admin/statistics', auth, videoConsultationController.getConsultationStatistics);
router.post('/admin/requests', auth, videoConsultationController.adminCreateConsultation);
router.post('/admin/requests/:id/reschedule', auth, videoConsultationController.rescheduleConsultation);
router.get('/admin/guest-requests', videoConsultationController.getGuestConsultationRequests);

// Admin consultation creation data endpoints
router.get('/admin/users', auth, videoConsultationController.getAllUsersForConsultation);
router.get('/admin/categories', auth, videoConsultationController.getCategoriesForConsultation);
router.get('/admin/subcategories/:categoryId', auth, videoConsultationController.getSubcategoriesForConsultation);
router.get('/admin/products', auth, videoConsultationController.getProductsForConsultation);

// Video cart item CRUD (for logged-in users)
router.get('/video-cart', auth, videoConsultationController.getVideoCart);
router.post('/video-cart', auth, videoConsultationController.addVideoCartItem);
router.put('/video-cart/:id', auth, videoConsultationController.updateVideoCartItem);
router.delete('/video-cart/:id', auth, videoConsultationController.removeVideoCartItem);
router.delete('/video-cart', auth, videoConsultationController.clearVideoCart);

module.exports = router; 