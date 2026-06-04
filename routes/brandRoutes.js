const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getBrands, createBrand } = require('../controllers/brandController');

const router = express.Router();

router.get('/', getBrands);

router.post(
  '/',
  protect,
  authorize('admin'),
  body('name').trim().notEmpty().withMessage('Brand name is required.'),
  createBrand
);

module.exports = router;
