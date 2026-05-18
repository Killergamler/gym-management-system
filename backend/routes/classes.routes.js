const router = require('express').Router();
const { body, param } = require('express-validator');
const ClassModel = require('../models/Class.model');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { runValidation, isObjectId } = require('../middleware/validate.middleware');
const { sendMongooseError } = require('../utils/error.util');

router.get('/upcoming', protect, async (req, res) => {
  try {
    const classes = await ClassModel.find({
      scheduledAt: { $gte: new Date() },
      isActive: true
    })
      .populate('trainerId', 'name specialty')
      .sort({ scheduledAt: 1 })
      .limit(20);

    return res.json({ success: true, classes });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.post(
  '/',
  protect,
  adminOnly,
  [
    body('title').trim().isLength({ min: 2, max: 120 }).withMessage('Class title is required'),
    body('scheduledAt').isISO8601().withMessage('Valid scheduled date/time is required'),
    body('durationMinutes').optional().isInt({ min: 15, max: 300 }).withMessage('Duration must be between 15 and 300 minutes'),
    body('capacity').optional().isInt({ min: 1, max: 500 }).withMessage('Capacity must be between 1 and 500'),
    runValidation
  ],
  async (req, res) => {
    try {
      const classDoc = await ClassModel.create(req.body);
      await classDoc.populate('trainerId', 'name specialty');
      return res.status(201).json({ success: true, class: classDoc });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

router.put(
  '/:id',
  protect,
  adminOnly,
  [param('id').custom(isObjectId).withMessage('Invalid class id'), runValidation],
  async (req, res) => {
    try {
      const classDoc = await ClassModel.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      }).populate('trainerId', 'name specialty');
      if (!classDoc) return res.status(404).json({ success: false, message: 'Class not found' });
      return res.json({ success: true, class: classDoc });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

router.delete(
  '/:id',
  protect,
  adminOnly,
  [param('id').custom(isObjectId).withMessage('Invalid class id'), runValidation],
  async (req, res) => {
    try {
      const classDoc = await ClassModel.findByIdAndDelete(req.params.id);
      if (!classDoc) return res.status(404).json({ success: false, message: 'Class not found' });
      return res.json({ success: true, message: 'Class deleted successfully' });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

module.exports = router;
