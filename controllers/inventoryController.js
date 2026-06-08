const Inventory = require('../models/Inventory');
const getAllItems = async (req, res, next) => {
  try {
    const items = await Inventory.find().sort({ createdAt: -1 });
    res.status(200).json({ message: 'Inventory items', data: items });
  } catch(e) { next(e); }
};
const createItem = async (req, res, next) => {
  try {
    const existing = await Inventory.findOne({ name: req.body.name });
    if (existing) return res.status(400).json({ message: 'Item already exists' });
    const item = await Inventory.create(req.body);
    res.status(201).json({ message: 'Item created', data: item });
  } catch(e) { next(e); }
};
const updateItem = async (req, res, next) => {
  try {
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.status(200).json({ message: 'Item updated', data: item });
  } catch(e) { next(e); }
};
const deleteItem = async (req, res, next) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Item deleted' });
  } catch(e) { next(e); }
};
const adjustQuantity = async (req, res, next) => {
  try {
    const { delta } = req.body;
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    item.qty = Math.max(0, item.qty + delta);
    await item.save();
    res.status(200).json({ message: 'Quantity updated', data: item });
  } catch(e) { next(e); }
};
module.exports = { getAllItems, createItem, updateItem, deleteItem, adjustQuantity };
