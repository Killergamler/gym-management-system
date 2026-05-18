const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true },
    startDate: { type: Date, required: true, default: Date.now },
    expiryDate: { type: Date, required: true },
    status: { type: String, enum: ['Active', 'Expired', 'Cancelled'], default: 'Active' },
    purchaseType: { type: String, enum: ['buy', 'renew', 'upgrade'], required: true },
    amount: { type: Number, required: true, min: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Membership', membershipSchema);
