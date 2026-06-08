const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const User = require('../models/User');

// POST /api/bookings — create a booking.
const createBooking = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { carId, serviceId, date, time, notes, total, paymentMethod } = req.body;

    // Verify the car belongs to this user.
    const car = await Car.findOne({ _id: carId, owner: req.user._id });
    if (!car) {
      return res.status(400).json({ message: 'Car not found or not owned by you.' });
    }

    const booking = await Booking.create({
      userId: req.user._id,
      carId,
      serviceId,
      date,
      time,
      notes: notes || '',
      total: total || 0,
      paymentMethod: paymentMethod || 'Cash',
      status: 'pending',
      assignedStaff: null,
    });

    // Award 10 loyalty points.
    await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } });

    res.status(201).json({
      message: 'Booking created successfully. +10 loyalty points!',
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/bookings/mine — get bookings for the logged-in user.
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id })
      .populate('carId', 'brand model year plate color emoji')
      .populate('assignedStaff', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'Bookings fetched.',
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};
// GET /api/bookings/all — get all bookings (admin/staff only).
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find()
      .populate('carId', 'brand model year plate color emoji')
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedStaff', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: 'All bookings fetched.',
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    next(error);
  }
};
// GET /api/bookings/:id — get a single booking.
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('carId', 'brand model year plate color emoji')
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedStaff', 'firstName lastName');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Only owner, staff, or admin can view.
    const isOwner = booking.userId._id.toString() === req.user._id.toString();
    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);
    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.status(200).json({ message: 'Booking fetched.', data: booking });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/status — update booking status (admin/staff only).
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be: ' + validStatuses.join(', ') });
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    res.status(200).json({ message: `Booking status updated to ${status}.`, data: booking });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/bookings/:id — cancel/delete a booking.
const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Only owner or admin can delete.
    const isOwner = booking.userId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    await Booking.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Booking deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/assign — assign staff (admin or staff claiming it).
const assignStaff = async (req, res, next) => {
  try {
    const { staffId } = req.body;
    if (staffId) {
      const staffUser = await User.findById(staffId);
      if (!staffUser || (staffUser.role !== 'staff' && staffUser.role !== 'admin')) {
        return res.status(400).json({ message: 'User is not a staff member.' });
      }
      if (staffUser.role === 'staff' && !staffUser.isRoleAssigned) {
        return res.status(400).json({ message: 'Staff member does not have an assigned role yet.' });
      }
    }
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { assignedStaff: staffId || null },
      { new: true, runValidators: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    res.status(200).json({ message: 'Staff assigned successfully.', data: booking });
  } catch (error) {
    next(error);
  }
};

// PUT /api/bookings/:id/edit — customer edits their own pending booking (owner only, >9h before).
const updateBookingByCustomer = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    // Only the owner can edit
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Only pending bookings can be edited
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending bookings can be edited.' });
    }

    // Must be more than 9 hours before the booking
    const bookingDateTime = new Date(`${booking.date}T${convertTo24h(booking.time)}`);
    const hoursUntil = (bookingDateTime - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil <= 9) {
      return res.status(400).json({ message: 'Cannot edit a booking within 9 hours of the appointment.' });
    }

    const { date, time, serviceId, notes, total, carId, paymentMethod } = req.body;

    // If changing date, verify no duplicate booking on that date
    if (date && date !== booking.date) {
      const dup = await Booking.findOne({
        userId: req.user._id,
        date,
        status: { $in: ['pending', 'in_progress'] },
        _id: { $ne: booking._id }
      });
      if (dup) return res.status(400).json({ message: 'You already have a booking on that date.' });
    }

    if (date)      booking.date      = date;
    if (time)      booking.time      = time;
    if (serviceId) booking.serviceId = serviceId;
    if (notes !== undefined) booking.notes = notes;
    if (total !== undefined) booking.total = total;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (carId) {
      const car = await Car.findOne({ _id: carId, owner: req.user._id });
      if (!car) return res.status(400).json({ message: 'Car not found or not owned by you.' });
      booking.carId = carId;
    }

    await booking.save();
    res.status(200).json({ message: 'Booking updated.', data: booking });
  } catch (error) {
    next(error);
  }
};

// POST /api/bookings/:id/cancel — cancel a booking by customer (owner only, pending only).
const cancelBookingByCustomer = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });

    // Only the owner can cancel
    if (booking.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Prevent cancellation of completed services
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed booking.' });
    }

    // Prevent cancellation of in_progress / cancelled services
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Cannot cancel a booking that is ${booking.status}.` });
    }

    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({ message: 'Booking cancelled successfully.', data: booking });
  } catch (error) {
    next(error);
  }
};

// Helper: convert "08:00 AM" -> "08:00"
function convertTo24h(timeStr) {
  if (!timeStr) return '00:00';
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  if (modifier === 'PM' && hours !== '12') hours = String(parseInt(hours) + 12);
  if (modifier === 'AM' && hours === '12') hours = '00';
  return `${hours.padStart(2,'0')}:${minutes}`;
}

module.exports = { createBooking, getMyBookings, getAllBookings, getBookingById, updateBookingStatus, deleteBooking, assignStaff, updateBookingByCustomer, cancelBookingByCustomer };

