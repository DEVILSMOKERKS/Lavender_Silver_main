const express = require('express');
const router = express.Router();
const clientDiaryController = require('../controllers/clientDiary.controller');
const auth = require('../middlewares/auth');
const { upload } = require('../middlewares/multer');

// Public routes (for frontend)
router.get('/', clientDiaryController.getClientDiaryImages);
router.get('/:id', clientDiaryController.getClientDiaryImage);

// Protected routes (for admin)
router.post('/', auth, clientDiaryController.createClientDiaryImage);
router.put('/:id', auth, upload.single('image', '/client_diary'), clientDiaryController.updateClientDiaryImage);
router.delete('/:id', auth, clientDiaryController.deleteClientDiaryImage);
router.post('/upload', auth, upload.single('image', '/client_diary'), clientDiaryController.uploadClientDiaryImage);

module.exports = router;
