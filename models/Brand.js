const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    logo: { type: String, default: '' },
    emoji: { type: String, default: '🚗' },
    models: { type: Object, default: {} },
    modelPictures: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Brand', brandSchema);
