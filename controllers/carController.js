const { validationResult } = require('express-validator');
const Car = require('../models/Car');

// GET /api/cars — get all cars for the logged-in user.
const getCars = async (req, res, next) => {
  try {
    const query = { owner: req.user._id };
    const cars = await Car.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      message: 'Cars fetched successfully.',
      count: cars.length,
      data: cars,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/cars — add a new car for the logged-in user.
const addCar = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { brand, model, year, plate, color, emoji } = req.body;

    const car = await Car.create({
      owner: req.user._id,
      brand,
      model,
      year: parseInt(year),
      plate,
      color,
      emoji: emoji || '🚗',
    });

    res.status(201).json({
      message: 'Car added successfully.',
      data: car,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cars/:id — delete a car owned by the logged-in user.
const deleteCar = async (req, res, next) => {
  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.id }
      : { _id: req.params.id, owner: req.user._id };

    const car = await Car.findOne(query);

    if (!car) {
      return res.status(404).json({ message: 'Car not found or not owned by you.' });
    }

    await Car.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Car deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCars, addCar, deleteCar };
