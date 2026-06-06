const { validationResult } = require('express-validator');
const Brand = require('../models/Brand');

const getBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find().lean().sort({ name: 1 });
    res.json({ data: brands });
  } catch (error) {
    next(error);
  }
};

const createBrand = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, logo, emoji, models, modelPictures } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Brand name is required.' });
    }

    const existing = await Brand.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: `Brand "${name}" already exists.` });
    }

    const brand = await Brand.create({
      name,
      logo: logo || '',
      emoji: emoji || '🚗',
      models: models || {},
      modelPictures: modelPictures || {},
    });

    res.status(201).json({ data: brand });
  } catch (error) {
    next(error);
  }
};

const updateBrand = async (req, res, next) => {
  try {
    const name = req.params.name;
    const { logo, emoji, models, modelPictures } = req.body;

    const brand = await Brand.findOneAndUpdate(
      { name },
      {
        logo: logo || '',
        emoji: emoji || '🚗',
        models: models || {},
        modelPictures: modelPictures || {},
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.json({ data: brand });
  } catch (error) {
    next(error);
  }
};

const deleteBrand = async (req, res, next) => {
  try {
    const name = req.params.name;
    const brand = await Brand.findOneAndDelete({ name });
    if (!brand) {
      return res.status(404).json({ message: `Brand "${name}" not found.` });
    }
    res.json({ data: brand });
  } catch (error) {
    next(error);
  }
};

module.exports = { getBrands, createBrand, updateBrand, deleteBrand };