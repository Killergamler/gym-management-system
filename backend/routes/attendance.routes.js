const router = require('express').Router();
const { body, query, param } = require('express-validator');
const Attendance = require('../models/Attendance.model');
const Member = require('../models/Member.model');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { runValidation, isObjectId } = require('../middleware/validate.middleware');
const { sendMongooseError } = require('../utils/error.util');
const { startOfDay, endOfDay } = require('../utils/date.util');

router.get(
  '/',
  protect,
  adminOnly,
  [
    query('limit').optional().isInt({ min: 1, max: 500 }).withMessage('Limit must be between 1 and 500').toInt(),
    runValidation
  ],
  async (req, res) => {
    try {
      const limit = Number(req.query.limit || 100);
      const records = await Attendance.find()
        .populate('memberId', 'name memberId email')
        .sort({ date: -1 })
        .limit(limit);
      return res.json({ success: true, records });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

router.post(
  '/checkin',
  protect,
  [body('memberId').custom(isObjectId).withMessage('Member id is invalid'), runValidation],
  async (req, res) => {
    try {
      const memberId = req.body.memberId;
      const memberExists = await Member.exists({ _id: memberId });
      if (!memberExists) return res.status(400).json({ success: false, message: 'Member not found' });

      const now = new Date();
      const date = startOfDay(now);
      const existing = await Attendance.findOne({ memberId, date });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Duplicate check-in is not allowed for the same day' });
      }

      const record = await Attendance.create({
        memberId,
        date,
        checkInTime: now,
        status: 'Present'
      });

      await record.populate('memberId', 'name memberId email');
      return res.status(201).json({ success: true, record });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

router.get('/member/:id', protect, [param('id').custom(isObjectId).withMessage('Invalid member id'), runValidation], async (req, res) => {
  try {
    const records = await Attendance.find({ memberId: req.params.id }).sort({ date: -1 }).limit(365);
    const totalAttendance = records.length;

    return res.json({ success: true, totalAttendance, records });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.get('/history/:id', protect, [param('id').custom(isObjectId).withMessage('Invalid member id'), runValidation], async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    const [records, monthlyCount] = await Promise.all([
      Attendance.find({ memberId: req.params.id }).sort({ date: -1 }).limit(365),
      Attendance.countDocuments({
        memberId: req.params.id,
        date: { $gte: startOfDay(monthStart), $lte: monthEnd }
      })
    ]);

    return res.json({ success: true, monthlyCount, records });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.get('/stats/weekly', protect, async (req, res) => {
  try {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const result = [];

    for (let i = 6; i >= 0; i -= 1) {
      const dayRef = new Date();
      dayRef.setDate(dayRef.getDate() - i);
      const dayStart = startOfDay(dayRef);
      const dayEnd = endOfDay(dayRef);

      const count = await Attendance.countDocuments({ date: { $gte: dayStart, $lte: dayEnd } });
      result.push({ day: days[dayRef.getDay()], count });
    }

    return res.json({ success: true, days: result });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

module.exports = router;
