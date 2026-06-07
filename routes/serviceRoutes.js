const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getServices, createService, updateService, deleteService } = require('../controllers/serviceController');

const router = express.Router();

router.get('/', getServices);

router.post(
  '/',
  protect,
  authorize('admin'),
  body('id').trim().notEmpty().withMessage('Service id is required.'),
  body('name').trim().notEmpty().withMessage('Service name is required.'),
  body('cat').trim().notEmpty().isIn(['maintenance', 'cleaning', 'repair', 'mileage']).withMessage('Service category is invalid.'),
  createService
);

router.put('/:id', protect, authorize('admin'), updateService);
router.delete('/:id', protect, authorize('admin'), deleteService);

module.exports = router;
