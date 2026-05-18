const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    checkInTime: { type: Date, default: Date.now },
    date: { type: Date, required: true, index: true },
    status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' }
  },
  { timestamps: true }
);

attendanceSchema.index({ memberId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
