const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    memberId: { type: String, trim: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    address: { type: String, trim: true },
    emergency: { type: String, trim: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
    joinDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    feeStatus: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },
    status: { type: String, enum: ['Active', 'Expired', 'Suspended'], default: 'Active' }
  },
  { timestamps: true, autoIndex: false }
);

module.exports = mongoose.model('Member', memberSchema);
