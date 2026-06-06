const express = require('express');
const { generateCode, getCodes, validateCode } = require('../controllers/staffCodeController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public: Validate a staff code during registration
router.get('/validate/:code', validateCode);

// Admin: Generate and list staff codes
router.post('/', protect, authorize('admin'), generateCode);
router.get('/', protect, authorize('admin'), getCodes);

module.exports = router;
