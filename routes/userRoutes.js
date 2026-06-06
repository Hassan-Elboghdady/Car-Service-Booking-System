const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getProfile, updateProfile, uploadProfileImage, getTopCustomers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../config/upload');

const router = express.Router();

// POST /api/users/register
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required.')
      .isLength({ min: 2 }).withMessage('First name must be at least 2 characters.')
      .matches(/^[A-Za-z]+$/).withMessage('First name may only contain letters.'),
    body('lastName').trim().notEmpty().withMessage('Last name is required.')
      .isLength({ min: 2 }).withMessage('Last name must be at least 2 characters.')
      .matches(/^[A-Za-z]+$/).withMessage('Last name may only contain letters.'),
    body('email').trim().isEmail().withMessage('Please enter a valid email address.'),
    body('phone').trim().notEmpty().withMessage('Phone number is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
  ],
  register
);

// POST /api/users/login
router.post(
  '/login',
  [
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  login
);

// POST /api/users/logout
router.post('/logout', logout);

// GET /api/users/profile — protected
router.get('/profile', protect, getProfile);

// PUT /api/users/profile — protected
router.put(
  '/profile',
  protect,
  [
    body('firstName').optional().trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters.').matches(/^[A-Za-z]+$/).withMessage('First name may only contain letters.'),
    body('lastName').optional().trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters.').matches(/^[A-Za-z]+$/).withMessage('Last name may only contain letters.'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty.'),
    body('newPassword').optional().isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  ],
  updateProfile
);

// POST /api/users/profile/image — protected, file upload
router.post('/profile/image', protect, upload.single('profileImage'), uploadProfileImage);

// GET /api/users/top-customers — admin only
router.get('/top-customers', protect, authorize('admin'), getTopCustomers);

module.exports = router;
