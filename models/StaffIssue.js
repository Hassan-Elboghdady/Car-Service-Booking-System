const mongoose = require('mongoose');

const staffIssueSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: String }, // Can be booking ID
  type: { type: String, required: true },
  severity: { type: String, default: 'low' },
  desc: { type: String, required: true },
  adminReply: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StaffIssue', staffIssueSchema);
