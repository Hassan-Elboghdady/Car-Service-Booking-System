const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  subject: { type: String, required: true },
  msg: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, default: 'unread' },
  adminReply: { type: String, default: '' },
  replies: {
    type: [
      new mongoose.Schema(
        {
          senderRole: { type: String, default: 'customer' },
          senderName: { type: String, default: 'Guest' },
          senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
          text: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        },
        { _id: false }
      ),
    ],
    default: [],
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ContactMessage', contactSchema);