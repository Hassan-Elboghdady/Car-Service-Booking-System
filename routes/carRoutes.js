const express = require('express');
const { body } = require('express-validator');
const { getCars, getAllCars, addCar, deleteCar } = require('../controllers/carController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

function isValidPlate(plate) {
  const cleaned = String(plate || '').replace(/\s+/g, '');
  // Allow Arabic letters and digits. Max letters: 3, max digits: 4, total max length 7.
  if (!/^[\p{Script=Arabic}0-9]{1,7}$/u.test(cleaned)) return false;
  const letters = (cleaned.match(/\p{Script=Arabic}/gu) || []).length;
  const digits = (cleaned.match(/[0-9]/g) || []).length;
  return letters <= 3 && digits <= 4;
}

// GET /api/cars/all — get ALL cars with owner info (admin only)
router.get('/all', protect, authorize('admin'), getAllCars);

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
    body('plate').trim().notEmpty().withMessage('License plate is required.')
      .custom((value) => isValidPlate(value)).withMessage('License plate may contain up to 4 letters and 4 numbers only.'),
    body('color').trim().notEmpty().withMessage('Car color is required.'),
  ],
  addCar
);

// DELETE /api/cars/:id — delete a car (protected)
router.delete('/:id', protect, deleteCar);

module.exports = router;

