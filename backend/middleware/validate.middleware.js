const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const runValidation = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const first = result.array({ onlyFirstError: true })[0];
  return res.status(400).json({
    success: false,
    message: first.msg,
    field: first.path
  });
};

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

module.exports = { runValidation, isObjectId };
