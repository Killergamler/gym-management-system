const sendMongooseError = (res, err) => {
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`
    });
  }

  if (err && err.name === 'ValidationError') {
    const first = Object.values(err.errors || {})[0];
    return res.status(400).json({
      success: false,
      message: first?.message || 'Validation failed'
    });
  }

  if (err && err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid identifier'
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Server error'
  });
};

module.exports = { sendMongooseError };
