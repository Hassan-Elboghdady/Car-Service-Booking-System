const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    icon: { type: String, default: '' },
    emoji: { type: String, default: '' },
    image: { type: String, default: '' },
    cat: {
      type: String,
      required: true,
      enum: ['maintenance', 'cleaning', 'repair', 'mileage'],
    },
    duration: { type: String, default: '' },
    price: { type: Number, default: 0 },
    priceByTier: { type: Object, default: {} },
    desc: { type: String, default: '' },
    popular: { type: Boolean, default: false },
    includes: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
