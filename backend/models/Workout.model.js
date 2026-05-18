const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    workoutName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    calories: { type: Number, required: true, min: 0 },
    duration: { type: Number, required: true, min: 1 },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workout', workoutSchema);
