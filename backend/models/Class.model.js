const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 600 },
    trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 60, min: 15, max: 300 },
    capacity: { type: Number, default: 30, min: 1, max: 500 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
