const router = require('express').Router();
const { body, param, query } = require('express-validator');
const Plan = require('../models/Plan.model');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { runValidation, isObjectId } = require('../middleware/validate.middleware');
const { sendMongooseError } = require('../utils/error.util');

const planCreateValidation = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Plan name must be 2-80 characters'),
  body('duration').isInt({ min: 1, max: 60 }).withMessage('Duration must be between 1 and 60 months'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('features.*').optional().trim().isLength({ min: 1, max: 120 }).withMessage('Feature text is invalid'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
  runValidation
];

const planUpdateValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Plan name must be 2-80 characters'),
  body('duration').optional().isInt({ min: 1, max: 60 }).withMessage('Duration must be between 1 and 60 months'),
  body('price').optional().isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
  body('features').optional().isArray().withMessage('Features must be an array'),
  body('features.*').optional().trim().isLength({ min: 1, max: 120 }).withMessage('Feature text is invalid'),
  body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
  runValidation
];

const idValidation = [param('id').custom(isObjectId).withMessage('Invalid plan id'), runValidation];
const getPlansValidation = [query('includeInactive').optional().isBoolean().toBoolean(), runValidation];

const sanitizePlan = (bodyData) => {
  const payload = { ...bodyData };
  if (typeof payload.name === 'string') payload.name = payload.name.trim();
  if (Array.isArray(payload.features)) {
    payload.features = payload.features.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return payload;
};

router.get('/', protect, getPlansValidation, async (req, res) => {
  try {
    const includeInactive = Boolean(req.query.includeInactive);
    const filter =
      includeInactive && req.user.role === 'admin' ? {} : { isActive: true };
    const plans = await Plan.find(filter).sort({ price: 1 });
    return res.json({ success: true, plans });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.post('/', protect, adminOnly, planCreateValidation, async (req, res) => {
  try {
    const plan = await Plan.create(sanitizePlan(req.body));
    return res.status(201).json({ success: true, plan });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.put('/:id', protect, adminOnly, idValidation, planUpdateValidation, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, sanitizePlan(req.body), {
      new: true,
      runValidators: true
    });

    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    return res.json({ success: true, plan });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.delete('/:id', protect, adminOnly, idValidation, async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    return res.json({ success: true, message: 'Plan deleted successfully' });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

module.exports = router;
