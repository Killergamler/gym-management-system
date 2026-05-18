const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const Member = require('../models/Member.model');
const Plan = require('../models/Plan.model');
const { addMonths } = require('../utils/date.util');
const { protect } = require('../middleware/auth.middleware');
const { sendMongooseError } = require('../utils/error.util');

const genToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

const buildAuthPayload = async (userDoc) => {
  let member = null;
  if (userDoc.role === 'member') {
    member = await Member.findOne({
      $or: [{ user: userDoc._id }, { email: userDoc.email }]
    }).select('_id memberId status expiryDate');
  }

  return {
    id: userDoc._id,
    name: userDoc.name,
    email: userDoc.email,
    role: userDoc.role,
    phone: userDoc.phone,
    memberDocId: member?._id || null,
    memberId: member?.memberId || null,
    membershipStatus: member?.status || null,
    membershipExpiryDate: member?.expiryDate || null
  };
};

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid email or password' });
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated' });

    const token = genToken(user._id);
    const userPayload = await buildAuthPayload(user);

    return res.json({ success: true, token, user: userPayload });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = 'member',
      gender = 'Other',
      address = '',
      emergency = '',
      planId = null
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: String(password),
      phone: phone ? String(phone).trim() : '',
      role
    });

    if (role === 'member') {
      const plan = planId ? await Plan.findById(planId) : null;
      const existingMember = await Member.findOne({ email: normalizedEmail });
      const now = new Date();
      const expiryDate = plan ? addMonths(now, plan.duration) : null;

      if (existingMember) {
        existingMember.user = user._id;
        existingMember.name = String(name).trim();
        existingMember.phone = phone || existingMember.phone;
        existingMember.address = address || existingMember.address;
        existingMember.emergency = emergency || existingMember.emergency;
        existingMember.gender = gender || existingMember.gender;
        if (plan) {
          existingMember.plan = plan._id;
          existingMember.expiryDate = expiryDate;
          existingMember.status = 'Active';
        }
        await existingMember.save();
      } else {
        const count = await Member.countDocuments();
        await Member.create({
          memberId: `M${String(count + 1).padStart(4, '0')}`,
          user: user._id,
          name: String(name).trim(),
          email: normalizedEmail,
          phone: String(phone || '').trim(),
          gender,
          address,
          emergency,
          plan: plan?._id || null,
          joinDate: now,
          expiryDate,
          status: plan ? 'Active' : 'Suspended',
          feeStatus: plan ? 'Pending' : 'Pending'
        });
      }
    }

    const token = genToken(user._id);
    const userPayload = await buildAuthPayload(user);
    return res.status(201).json({ success: true, token, user: userPayload });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const userPayload = await buildAuthPayload(req.user);
    return res.json({ success: true, user: userPayload });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

module.exports = router;
