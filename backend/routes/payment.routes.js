const router = require('express').Router();
const Payment = require('../models/Payment.model');
const Member = require('../models/Member.model');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { sendMongooseError } = require('../utils/error.util');

const paymentPopulate = [
  { path: 'member', select: 'name email memberId' },
  { path: 'plan', select: 'name price duration' },
  { path: 'membership', select: 'startDate expiryDate status purchaseType' }
];

router.get('/', protect, async (req, res) => {
  try {
    const limit = Number(req.query.limit || 200);
    const payments = await Payment.find()
      .populate(paymentPopulate)
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.json({ success: true, payments });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.get('/member/:id', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ member: req.params.id })
      .populate('plan', 'name price duration')
      .populate('membership', 'startDate expiryDate status purchaseType')
      .sort({ createdAt: -1 });

    return res.json({ success: true, payments });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const count = await Payment.countDocuments();
    const invoiceNo = `INV-${String(count + 1).padStart(6, '0')}`;
    const payment = await Payment.create({
      ...req.body,
      invoiceNo,
      transactionType: req.body.transactionType || 'manual'
    });

    if (payment.status === 'Paid') {
      await Member.findByIdAndUpdate(payment.member, { feeStatus: 'Paid' });
    }

    await payment.populate(paymentPopulate);
    return res.status(201).json({ success: true, payment });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate(paymentPopulate);

    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    return res.json({ success: true, payment });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    return res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

module.exports = router;
