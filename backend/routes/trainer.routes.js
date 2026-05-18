const router = require('express').Router();
const Trainer = require('../models/Trainer.model');
const { protect, adminOnly } = require('../middleware/auth.middleware');
const { sendMongooseError } = require('../utils/error.util');

router.get('/', protect, async (req, res) => {
  try {
    const trainers = await Trainer.find().sort({ createdAt: -1 });
    return res.json({ success: true, trainers });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const trainer = await Trainer.create(req.body);
    return res.status(201).json({ success: true, trainer });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    return res.json({ success: true, trainer });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const trainer = await Trainer.findByIdAndDelete(req.params.id);
    if (!trainer) return res.status(404).json({ success: false, message: 'Trainer not found' });
    return res.json({ success: true, message: 'Trainer deleted successfully' });
  } catch (err) {
    return sendMongooseError(res, err);
  }
});

module.exports = router;
