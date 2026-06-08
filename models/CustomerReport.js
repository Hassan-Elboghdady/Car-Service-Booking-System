const mongoose = require('mongoose');

const customerReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  category: { type: String, required: true },
  desc: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in_progress', 'resolved'], default: 'pending' },
  adminReply: { type: String, default: '' },
  repliedAt: { type: Date },
  replies: {
    type: [
      {
        senderRole: { type: String, required: true },
        senderName: { type: String, required: true },
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    default: []
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomerReport', customerReportSchema);
