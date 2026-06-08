const mongoose = require('mongoose');
const staffIssueSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: String },
  type: { type: String, required: true },
  severity: { type: String, default: 'low' },
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
  },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('StaffIssue', staffIssueSchema);
