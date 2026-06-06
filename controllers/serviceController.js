const { validationResult } = require('express-validator');
const Service = require('../models/Service');

const getServices = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.cat) filter.cat = req.query.cat;
    const services = await Service.find(filter).lean().sort({ createdAt: 1 });
    res.json({ data: services });
  } catch (error) {
    next(error);
  }
};

const createService = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      id,
      name,
      icon,
      emoji,
      cat,
      duration,
      price,
      priceByTier,
      desc,
      popular,
      includes,
    } = req.body;

    if (!id || !name || !cat) {
      return res.status(400).json({ message: 'Service id, name, and category are required.' });
    }

    const existing = await Service.findOne({ id });
    if (existing) {
      return res.status(409).json({ message: `Service with id "${id}" already exists.` });
    }

    const service = await Service.create({
      id,
      name,
      icon: icon || '',
      emoji: emoji || '',
      cat,
      duration: duration || '',
      price: price || 0,
      priceByTier: priceByTier || {},
      desc: desc || '',
      popular: !!popular,
      includes: Array.isArray(includes) ? includes : [],
    });

    res.status(201).json({ data: service });
  } catch (error) {
    next(error);
  }
};

const updateService = async (req, res, next) => {
  try {
    const id = req.params.id;
    const {
      name,
      icon,
      emoji,
      cat,
      duration,
      price,
      priceByTier,
      desc,
      popular,
      includes,
    } = req.body;

    if (!id || !name || !cat) {
      return res.status(400).json({ message: 'Service id, name, and category are required.' });
    }

    const service = await Service.findOneAndUpdate(
      { id },
      {
        name,
        icon: icon || '',
        emoji: emoji || '',
        cat,
        duration: duration || '',
        price: price || 0,
        priceByTier: priceByTier || {},
        desc: desc || '',
        popular: !!popular,
        includes: Array.isArray(includes) ? includes : [],
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    res.json({ data: service });
  } catch (error) {
    next(error);
  }
};

const deleteService = async (req, res, next) => {
  try {
    const id = req.params.id;
    const service = await Service.findOneAndDelete({ id });
    if (!service) {
      return res.status(404).json({ message: `Service with id "${id}" not found.` });
    }
    res.json({ data: service });
  } catch (error) {
    next(error);
  }
};

module.exports = { getServices, createService, updateService, deleteService };