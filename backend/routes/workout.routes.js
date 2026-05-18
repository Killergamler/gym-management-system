const router = require('express').Router();
const { body, param } = require('express-validator');
const Workout = require('../models/Workout.model');
const { protect } = require('../middleware/auth.middleware');
const { runValidation, isObjectId } = require('../middleware/validate.middleware');
const { sendMongooseError } = require('../utils/error.util');

router.post(
  '/',
  protect,
  [
    body('memberId').custom(isObjectId).withMessage('Member id is invalid'),
    body('workoutName').trim().isLength({ min: 2, max: 120 }).withMessage('Workout name is required'),
    body('calories').isFloat({ min: 0 }).withMessage('Calories must be a positive number'),
    body('duration').isFloat({ gt: 0 }).withMessage('Duration must be greater than 0'),
    body('date').optional().isISO8601().withMessage('Date must be valid'),
    runValidation
  ],
  async (req, res) => {
    try {
      const workout = await Workout.create({
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : new Date()
      });
      return res.status(201).json({ success: true, workout });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

router.get(
  '/member/:id',
  protect,
  [param('id').custom(isObjectId).withMessage('Invalid member id'), runValidation],
  async (req, res) => {
    try {
      const workouts = await Workout.find({ memberId: req.params.id }).sort({ date: -1 });
      return res.json({ success: true, workouts });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

router.delete(
  '/:id',
  protect,
  [param('id').custom(isObjectId).withMessage('Invalid workout id'), runValidation],
  async (req, res) => {
    try {
      const workout = await Workout.findByIdAndDelete(req.params.id);
      if (!workout) return res.status(404).json({ success: false, message: 'Workout not found' });
      return res.json({ success: true, message: 'Workout deleted successfully' });
    } catch (err) {
      return sendMongooseError(res, err);
    }
  }
);

module.exports = router;
