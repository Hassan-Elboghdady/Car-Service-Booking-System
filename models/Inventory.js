const mongoose = require('mongoose');
const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String },
  cat: { type: String },
  unit: { type: String },
  cost: { type: Number, default: 0 },
  qty: { type: Number, default: 0 },
  lowAt: { type: Number, default: 5 },
  supplier: { type: String },
  minOrder: { type: Number, default: 1 },
  notes: { type: String }
}, { timestamps: true });
module.exports = mongoose.model('Inventory', inventorySchema);
