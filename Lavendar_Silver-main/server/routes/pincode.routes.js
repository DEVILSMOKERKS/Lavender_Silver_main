const express = require('express');
const router = express.Router();
const pincodeController = require('../controllers/pincode.controller');
const auth = require('../middlewares/auth');
const { requireRole } = require('../middlewares/auth');

// PUBLIC ROUTES (For product page pincode search)
router.get('/search', pincodeController.searchPincode);
router.get('/lookup', pincodeController.lookupPincode);

// ADMIN ROUTES (Protected)
router.get('/fetch-details', auth, requireRole('admin'), pincodeController.fetchPincodeDetails);
router.get('/', auth, requireRole('admin'), pincodeController.getAllPincodes);
router.get('/:id', auth, requireRole('admin'), pincodeController.getPincodeById);
router.post('/', auth, requireRole('admin'), pincodeController.createPincode);
router.put('/:id', auth, requireRole('admin'), pincodeController.updatePincode);
router.delete('/:id', auth, requireRole('admin'), pincodeController.deletePincode);

module.exports = router;

