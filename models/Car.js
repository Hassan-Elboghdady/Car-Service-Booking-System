const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Car must have an owner'],
    },
    brand: {
      type: String,
      required: [true, 'Car brand is required'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Car model is required'],
      trim: true,
    },
    year: {
      type: Number,
      required: [true, 'Car year is required'],
      min: [2000, 'Year must be 2000 or later'],
      max: [2030, 'Year must be 2030 or earlier'],
    },
    plate: {
      type: String,
      required: [true, 'License plate is required'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Car color is required'],
      trim: true,
    },
    emoji: {
      type: String,
      default: '🚗',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Car', carSchema);
