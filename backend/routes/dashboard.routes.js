const router = require('express').Router();
const { param } = require('express-validator');
const Member = require('../models/Member.model');
const Membership = require('../models/Membership.model');
const Payment = require('../models/Payment.model');
const Trainer = require('../models/Trainer.model');
const Attendance = require('../models/Attendance.model');
const Notification = require('../models/Notification.model');
const ClassModel = require('../models/Class.model');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { sendMongooseError } = require('../utils/error.util');
const { runValidation, isObjectId } = require('../middleware/validate.middleware');
const { diffDaysInclusive, startOfDay } = require('../utils/date.util');

router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const todayStart = startOfDay();

    const [
      totalMembers,
      activeMembers,
      expiredMembers,
      pendingFees,
      totalTrainers,
      todayAttendance,
      paidPayments,
      monthPayments
    ] = await Promise.all([
      Member.countDocuments(),
      Member.countDocuments({ status: 'Active' }),
      Member.countDocuments({ status: 'Expired' }),
      Member.countDocuments({ feeStatus: 'Pending' }),
      Trainer.countDocuments({ isActive: true }),
      Attendance.countDocuments({ date: todayStart }),
      Payment.find({ status: 'Paid' }).select('amount'),
      Payment.find({ date: { $gte: startOfMonth }, status: 'Paid' }).select('amount')
    ]);

    const monthlyRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount, 0);

    const revenueData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      const start = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const pays = await Payment.find({ date: { $gte: start, $lte: end }, status: 'Paid' }).select('amount');
      const total = pays.reduce((sum, p) => sum + p.amount, 0);
      revenueData.push({ month: monthNames[start.getMonth()], total });
    }

    return res.json({
      success: true,
      stats: {
        totalMembers,
        activeMembers,
        expiredMembers,
        pendingFees,
        monthlyRevenue,
        totalRevenue,
        totalTrainers,
        todayAttendance
      },
      revenueData
    });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.get(
  '/member/:id',
  protect,
  [param('id').custom(isObjectId).withMessage('Invalid member id'), runValidation],
  async (req, res) => {
    try {
      const memberId = req.params.id;
      const member = await Member.findById(memberId).populate('plan', 'name duration price');
      if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

      const [latestMembership, upcomingClasses, paymentHistory, totalAttendance, latestNotifications] = await Promise.all([
        Membership.findOne({ memberId }).sort({ createdAt: -1 }).populate('planId', 'name price duration'),
        ClassModel.find({ scheduledAt: { $gte: new Date() }, isActive: true })
          .populate('trainerId', 'name specialty')
          .sort({ scheduledAt: 1 })
          .limit(5),
        Payment.find({ member: memberId })
          .populate('plan', 'name price duration')
          .sort({ createdAt: -1 })
          .limit(8),
        Attendance.countDocuments({ memberId }),
        Notification.find({ memberId }).sort({ createdAt: -1 }).limit(6)
      ]);

      const membershipSource = latestMembership || member;
      const expiryDate = membershipSource.expiryDate ? new Date(membershipSource.expiryDate) : null;
      const remainingDays = expiryDate ? Math.max(diffDaysInclusive(expiryDate), 0) : 0;
      const membershipStatus =
        expiryDate && remainingDays > 0 && member.status !== 'Suspended' ? 'Active' : 'Expired';

      return res.json({
        success: true,
        dashboard: {
          member: {
            id: member._id,
            memberId: member.memberId,
            name: member.name,
            email: member.email
          },
          membershipStatus,
          remainingMembershipDays: remainingDays,
          membershipExpiryDate: expiryDate,
          upcomingClasses,
          paymentHistory,
          totalAttendance,
          latestNotifications
        }
      });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

module.exports = router;
