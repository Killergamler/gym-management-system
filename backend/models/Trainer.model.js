const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  phone:      { type: String, required: true },
  specialty:  { type: String, required: true },
  shift:      { type: String, enum: ['Morning','Evening','Full Day'], default: 'Morning' },
  experience: { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Trainer', trainerSchema);