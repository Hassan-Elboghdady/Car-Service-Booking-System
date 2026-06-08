const mongoose = require('mongoose');
const bookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Booking must belong to a user'],
    },
    carId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Car',
      required: [true, 'Booking must include a car'],
    },
    serviceId: {
      type: String,
      required: [true, 'Service ID is required'],
      trim: true,
    },
    date: {
      type: String,
      required: [true, 'Booking date is required'],
    },
    time: {
      type: String,
      required: [true, 'Booking time is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    total: {
      type: Number,
      default: 0,
      min: [0, 'Total cannot be negative'],
    },
    assignedStaff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Card (Visa/MC)', 'Bank Transfer', 'InstaPay'],
      default: 'Cash',
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model('Booking', bookingSchema);
