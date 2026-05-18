const router = require('express').Router();
const { body, param } = require('express-validator');
const Notification = require('../models/Notification.model');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { runValidation, isObjectId } = require('../middleware/validate.middleware');
const { sendMongooseError } = require('../utils/error.util');

router.get(
  '/:id',
  protect,
  [param('id').custom(isObjectId).withMessage('Invalid member id'), runValidation],
  async (req, res) => {
    try {
      const notifications = await Notification.find({ memberId: req.params.id }).sort({ createdAt: -1 });
      const unreadCount = notifications.filter((item) => !item.isRead).length;
      return res.json({ success: true, unreadCount, notifications });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

router.put(
  '/read/:id',
  protect,
  [param('id').custom(isObjectId).withMessage('Invalid notification id'), runValidation],
  async (req, res) => {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.id,
        { isRead: true },
        { new: true, runValidators: true }
      );
      if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
      return res.json({ success: true, notification });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

router.post(
  '/',
  protect,
  adminOnly,
  [
    body('memberId').custom(isObjectId).withMessage('Invalid member id'),
    body('title').trim().isLength({ min: 2, max: 140 }).withMessage('Title is required'),
    body('message').trim().isLength({ min: 4, max: 600 }).withMessage('Message is required'),
    body('type')
      .isIn(['membership-expiry', 'class-reminder', 'payment-reminder'])
      .withMessage('Invalid notification type'),
    runValidation
  ],
  async (req, res) => {
    try {
      const notification = await Notification.create(req.body);
      return res.status(201).json({ success: true, notification });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

module.exports = router;
