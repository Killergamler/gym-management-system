const router = require('express').Router();
const Member = require('../models/Member.model');
const Plan = require('../models/Plan.model');
const User = require('../models/User.model');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { sendMongooseError } = require('../utils/error.util');
const { addMonths } = require('../utils/date.util');

const getMemberWithRelations = (query) =>
  Member.find(query)
    .populate('plan', 'name price duration features')
    .populate('trainer', 'name specialty')
    .populate('user', 'name email role');

router.get('/', protect, async (req, res) => {
  try {
    const { status, feeStatus, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (feeStatus) query.feeStatus = feeStatus;
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { memberId: new RegExp(search, 'i') }
      ];
    }

    const total = await Member.countDocuments(query);
    const members = await getMemberWithRelations(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    return res.json({ success: true, total, members });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const member = await Member.findOne({
      $or: [{ user: req.user._id }, { email: req.user.email }]
    })
      .populate('plan', 'name duration price features')
      .populate('trainer', 'name specialty');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'No member profile found for this user'
      });
    }

    return res.json({ success: true, member });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('plan', 'name duration price features')
      .populate('trainer', 'name specialty')
      .populate('user', 'name email role');
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    return res.json({ success: true, member });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const count = await Member.countDocuments();
    const memberId = `M${String(count + 1).padStart(4, '0')}`;

    const planDoc = req.body.plan ? await Plan.findById(req.body.plan) : null;
    const joinDate = req.body.joinDate ? new Date(req.body.joinDate) : new Date();
    const expiryDate = planDoc ? addMonths(joinDate, planDoc.duration) : null;

    let linkedUser = null;
    if (req.body.user) {
      linkedUser = await User.findById(req.body.user);
      if (!linkedUser) return res.status(400).json({ success: false, message: 'Linked user not found' });
    }

    const member = await Member.create({
      ...req.body,
      memberId,
      user: linkedUser?._id || req.body.user || null,
      joinDate,
      expiryDate
    });

    const populated = await Member.findById(member._id)
      .populate('plan', 'name duration price features')
      .populate('trainer', 'name specialty')
      .populate('user', 'name email role');
    return res.status(201).json({ success: true, member: populated });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.plan) {
      const plan = await Plan.findById(payload.plan);
      if (!plan) return res.status(400).json({ success: false, message: 'Plan not found' });

      const baseDate = payload.joinDate ? new Date(payload.joinDate) : new Date();
      payload.expiryDate = addMonths(baseDate, plan.duration);
      payload.status = 'Active';
    }

    const member = await Member.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true
    })
      .populate('plan', 'name duration price features')
      .populate('trainer', 'name specialty')
      .populate('user', 'name email role');

    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    return res.json({ success: true, member });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });
    return res.json({ success: true, message: 'Member deleted successfully' });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

module.exports = router;
