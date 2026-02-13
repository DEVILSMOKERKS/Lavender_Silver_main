const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/auth');
const supportController = require('../controllers/support.controller');

// User routes
router.get('/', authenticate, supportController.getMessages);
router.post('/', authenticate, supportController.sendMessage);
router.patch('/read', authenticate, supportController.markAllAsRead);

// User ticket history routes
router.get('/tickets', authenticate, supportController.getUserTickets);
router.get('/tickets/:ticket_id/messages', authenticate, supportController.getUserTicketMessages);
router.post('/tickets/:ticket_id/reply', authenticate, supportController.sendMessage);

// Admin ticket routes
router.get('/admin/tickets', authenticate, supportController.getTickets);
router.get('/admin/tickets/:ticket_id/messages', authenticate, supportController.getTicketMessages);
router.get('/admin/tickets/:ticket_id/details', authenticate, supportController.getTicketDetails);
router.post('/admin/tickets', authenticate, supportController.createTicket);
router.post('/admin/tickets/:ticket_id/reply', authenticate, supportController.replyTicket);
router.put('/admin/tickets/:ticket_id', authenticate, supportController.updateTicket);
router.delete('/admin/tickets/:ticket_id', authenticate, supportController.deleteTicket);

module.exports = router; 