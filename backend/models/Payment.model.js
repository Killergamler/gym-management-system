const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, trim: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    membership: { type: mongoose.Schema.Types.ObjectId, ref: 'Membership' },
    amount: { type: Number, required: true, min: 1 },
    method: { type: String, enum: ['Cash', 'UPI', 'Card', 'NetBanking'], default: 'Cash' },
    status: { type: String, enum: ['Paid', 'Pending', 'Failed'], default: 'Paid' },
    transactionType: { type: String, enum: ['buy', 'renew', 'upgrade', 'manual'], default: 'manual' },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true, autoIndex: false }
);

module.exports = mongoose.model('Payment', paymentSchema);
