const { validationResult } = require('express-validator');
const User = require('../models/User');
const Car = require('../models/Car');

// GET /complete-profile
const renderCompleteProfile = (req, res) => {
  // If the user's profile is already completed, redirect to home
  if (req.user && req.user.profileCompleted) {
    return res.redirect('/');
  }
  res.status(200).render('complete-profile');
};

// POST /api/users/complete-profile
const submitCompleteProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { phone, brand, model, year, plate, color, emoji } = req.body;

    // Check if the phone number is already registered to another account (excluding this user)
    const existingPhone = await User.findOne({
      phone,
      _id: { $ne: req.user._id }
    });

    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already registered to another account.' });
    }

    // 1. Update User document with all fields and mark profileCompleted as true
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        phone,
        phoneNumber: phone,
        carBrand: brand,
        carModel: model,
        carYear: parseInt(year),
        licensePlate: plate,
        carColor: color,
        profileCompleted: true
      },
      { new: true, runValidators: true }
    );

    // 2. Create or update the corresponding Car model document
    let car = await Car.findOne({ owner: req.user._id });
    if (car) {
      car.brand = brand;
      car.model = model;
      car.year = parseInt(year);
      car.plate = plate;
      car.color = color;
      car.emoji = emoji || '🚗';
      await car.save();
    } else {
      car = await Car.create({
        owner: req.user._id,
        brand,
        model,
        year: parseInt(year),
        plate,
        color,
        emoji: emoji || '🚗',
      });
    }

    res.status(200).json({
      message: 'Profile completed successfully.',
      data: updatedUser,
      car
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  renderCompleteProfile,
  submitCompleteProfile
};
