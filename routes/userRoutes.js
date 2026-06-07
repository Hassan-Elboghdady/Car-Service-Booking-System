const express = require('express');
const { body } = require('express-validator');
const { register, login, logout, getProfile, updateProfile, uploadProfileImage, getTopCustomers, getAllStaff, deleteStaff, updateStaffRole } = require('../controllers/userController');
const { submitCompleteProfile } = require('../controllers/completeProfileController');
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
// GET /api/users/staff — admin only
router.get('/staff', protect, authorize('admin'), getAllStaff);

// DELETE /api/users/staff/:id — admin only
router.delete('/staff/:id', protect, authorize('admin'), deleteStaff);

// PUT /api/users/staff/:id/role — admin only
router.put('/staff/:id/role', protect, authorize('admin'), updateStaffRole);

function isValidPlate(plate) {
  const cleaned = String(plate || '').replace(/\s+/g, '');
  if (!/^[\p{Script=Arabic}0-9]{1,7}$/u.test(cleaned)) return false;
  const letters = (cleaned.match(/\p{Script=Arabic}/gu) || []).length;
  const digits = (cleaned.match(/[0-9]/g) || []).length;
  return letters <= 3 && digits <= 4;
}

// POST /api/users/complete-profile
router.post(
  '/complete-profile',
  protect,
  [
    body('phone').trim().notEmpty().withMessage('Phone number is required.')
      .matches(/^(010|011|012|015)\d{8}$/).withMessage('Valid Egyptian mobile required (11 digits, starting 010/011/012/015).'),
    body('brand').trim().notEmpty().withMessage('Car brand is required.'),
    body('model').trim().notEmpty().withMessage('Car model is required.'),
    body('year').isInt({ min: 2000, max: 2030 }).withMessage('Year must be between 2000 and 2030.'),
    body('plate').trim().notEmpty().withMessage('License plate is required.')
      .custom((value) => isValidPlate(value)).withMessage('License plate must use up to 3 Arabic letters and up to 4 digits.'),
    body('color').trim().notEmpty().withMessage('Car color is required.'),
  ],
  submitCompleteProfile
);

module.exports = router;
