const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const notificationController = require('../controllers/notification.controller');

// All routes require authentication (admin)
router.get('/', authenticate, notificationController.getAllNotifications); // Get all notifications (paginated)
router.post('/', authenticate, notificationController.createNotification); // Create notification
router.patch('/:id/read', authenticate, notificationController.markAsRead); // Mark as read by id
router.delete('/:id', authenticate, notificationController.deleteNotification); // Delete by id
router.delete('/', authenticate, notificationController.deleteAllNotifications); // Delete all

module.exports = router; 