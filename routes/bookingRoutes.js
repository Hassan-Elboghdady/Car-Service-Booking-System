const express = require('express');
const { body } = require('express-validator');
const { createBooking, getMyBookings, getAllBookings, getBookingById, updateBookingStatus, deleteBooking, assignStaff, updateBookingByCustomer, cancelBookingByCustomer } = require('../controllers/bookingController');
const { protect, authorize, requireStaffRole } = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/bookings — create a booking (protected)
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

// GET /api/bookings/mine — get my bookings (protected)
router.get('/mine', protect, getMyBookings);
// GET /api/bookings/all — get all bookings (admin/staff only)
router.get('/all', protect, authorize('admin', 'staff'), requireStaffRole, getAllBookings);
// GET /api/bookings/:id — get a single booking (protected)
router.get('/:id', protect, getBookingById);

// PUT /api/bookings/:id/status — update booking status (admin/staff only)
router.put('/:id/status', protect, authorize('admin', 'staff'), requireStaffRole, updateBookingStatus);
// PUT /api/bookings/:id/assign — assign staff (admin or staff claiming it)
router.put('/:id/assign', protect, authorize('admin', 'staff'), requireStaffRole, assignStaff);
// PUT /api/bookings/:id/edit — customer edits their own pending booking (owner, >9h before)
router.put('/:id/edit', protect, updateBookingByCustomer);
// POST /api/bookings/:id/cancel — customer cancels their own pending booking
router.post('/:id/cancel', protect, cancelBookingByCustomer);
// DELETE /api/bookings/:id — cancel/delete a booking (owner or admin)
router.delete('/:id', protect, deleteBooking);

module.exports = router;
