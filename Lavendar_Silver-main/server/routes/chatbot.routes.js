const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// Public route for fetching chatbot questions (no authentication required)
router.get('/questions/public', chatbotController.getAllQuestions);

// Admin routes (require authentication)
router.post('/questions', auth, requireRole('admin'), chatbotController.createQuestion);
router.get('/questions', auth, requireRole('admin'), chatbotController.getAllQuestions);
router.put('/questions/:id', auth, requireRole('admin'), chatbotController.updateQuestion);
router.delete('/questions/:id', auth, requireRole('admin'), chatbotController.deleteQuestion);

module.exports = router;