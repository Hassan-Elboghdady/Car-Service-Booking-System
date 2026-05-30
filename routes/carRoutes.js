const express = require('express');
const { body } = require('express-validator');
const { getCars, addCar, deleteCar } = require('../controllers/carController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/cars — get user's cars (protected)
router.get('/', protect, getCars);

// POST /api/cars — add a car (protected)
router.post(
  '/',
  protect,
  [
    body('brand').trim().notEmpty().withMessage('Car brand is required.'),
    body('model').trim().notEmpty().withMessage('Car model is required.'),
    body('year').isInt({ min: 2000, max: 2030 }).withMessage('Year must be between 2000 and 2030.'),
    body('plate').trim().notEmpty().withMessage('License plate is required.'),
    body('color').trim().notEmpty().withMessage('Car color is required.'),
  ],
  addCar
);

// DELETE /api/cars/:id — delete a car (protected)
router.delete('/:id', protect, deleteCar);

module.exports = router;
