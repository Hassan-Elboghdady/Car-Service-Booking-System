const express = require('express');
const { body } = require('express-validator');
const { createBooking, getMyBookings, getAllBookings, getBookingById, updateBookingStatus, deleteBooking, assignStaff, updateBookingByCustomer, cancelBookingByCustomer } = require('../controllers/bookingController');
const { protect, authorize, requireStaffRole } = require('../middleware/authMiddleware');
const router = express.Router();
router.post(
  '/',
  protect,
  [
    body('carId').notEmpty().withMessage('Car ID is required.'),
    body('serviceId').trim().notEmpty().withMessage('Service ID is required.'),
    body('date').notEmpty().withMessage('Date is required.'),
    body('time').trim().notEmpty().withMessage('Time is required.'),
  ],
  createBooking
);
router.get('/mine', protect, getMyBookings);
router.get('/all', protect, authorize('admin', 'staff'), requireStaffRole, getAllBookings);
router.get('/:id', protect, getBookingById);
router.put('/:id/status', protect, authorize('admin', 'staff'), requireStaffRole, updateBookingStatus);
router.put('/:id/assign', protect, authorize('admin', 'staff'), requireStaffRole, assignStaff);
router.put('/:id/edit', protect, updateBookingByCustomer);
router.post('/:id/cancel', protect, cancelBookingByCustomer);
router.delete('/:id', protect, deleteBooking);
module.exports = router;
