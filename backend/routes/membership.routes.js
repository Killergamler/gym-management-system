const router = require('express').Router();
const { body } = require('express-validator');
const Membership = require('../models/Membership.model');
const Member = require('../models/Member.model');
const Plan = require('../models/Plan.model');
const Payment = require('../models/Payment.model');
const { protect } = require('../middleware/auth.middleware');
const { runValidation, isObjectId } = require('../middleware/validate.middleware');
const { sendMongooseError } = require('../utils/error.util');
const { addMonths } = require('../utils/date.util');

const purchaseValidation = [
  body('memberId').custom(isObjectId).withMessage('Member id is invalid'),
  body('planId').custom(isObjectId).withMessage('Plan id is invalid'),
  body('method').optional().isIn(['Cash', 'UPI', 'Card', 'NetBanking']).withMessage('Invalid payment method'),
  runValidation
];

const makeInvoiceNo = async () => {
  const count = await Payment.countDocuments();
  return `INV-${String(count + 1).padStart(6, '0')}`;
};

const calculateWindow = ({ action, currentExpiry, duration }) => {
  const now = new Date();
  const currentExpiryDate = currentExpiry ? new Date(currentExpiry) : null;

  if (action === 'buy') {
    const startDate = now;
    return { startDate, expiryDate: addMonths(startDate, duration) };
  }

  const base =
    currentExpiryDate && currentExpiryDate.getTime() > now.getTime() ? currentExpiryDate : now;
  return { startDate: base, expiryDate: addMonths(base, duration) };
};

const performMembershipAction = async ({ action, memberId, planId, method }) => {
  const member = await Member.findById(memberId);
  if (!member) throw new Error('Member not found');

  const plan = await Plan.findOne({ _id: planId, isActive: true });
  if (!plan) throw new Error('Plan not found or inactive');

  const { startDate, expiryDate } = calculateWindow({
    action,
    currentExpiry: member.expiryDate,
    duration: plan.duration
  });

  const membership = await Membership.create({
    memberId: member._id,
    planId: plan._id,
    startDate,
    expiryDate,
    status: 'Active',
    purchaseType: action,
    amount: plan.price
  });

  const payment = await Payment.create({
    invoiceNo: await makeInvoiceNo(),
    member: member._id,
    plan: plan._id,
    membership: membership._id,
    amount: plan.price,
    method: method || 'Cash',
    status: 'Paid',
    transactionType: action,
    date: new Date()
  });

  member.plan = plan._id;
  member.expiryDate = expiryDate;
  member.status = 'Active';
  member.feeStatus = 'Paid';
  await member.save();

  await membership.populate('planId', 'name duration price features');
  await payment.populate('plan', 'name duration price');

  return { member, membership, payment };
};

router.post('/buy', protect, purchaseValidation, async (req, res) => {
  try {
    const { memberId, planId, method } = req.body;
    const result = await performMembershipAction({ action: 'buy', memberId, planId, method });
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    if (err.message === 'Member not found' || err.message === 'Plan not found or inactive') {
      return res.status(404).json({ success: false, message: err.message });
    }
    return sendMongooseError(res, err);
  }
});

router.put('/renew', protect, purchaseValidation, async (req, res) => {
  try {
    const { memberId, planId, method } = req.body;
    const result = await performMembershipAction({ action: 'renew', memberId, planId, method });
    return res.json({ success: true, ...result });
  } catch (err) {
    if (err.message === 'Member not found' || err.message === 'Plan not found or inactive') {
      return res.status(404).json({ success: false, message: err.message });
    }
    return sendMongooseError(res, err);
  }
});

router.put('/upgrade', protect, purchaseValidation, async (req, res) => {
  try {
    const { memberId, planId, method } = req.body;
    const result = await performMembershipAction({ action: 'upgrade', memberId, planId, method });
    return res.json({ success: true, ...result });
  } catch (err) {
    if (err.message === 'Member not found' || err.message === 'Plan not found or inactive') {
      return res.status(404).json({ success: false, message: err.message });
    }
    return sendMongooseError(res, err);
  }
});

module.exports = router;
