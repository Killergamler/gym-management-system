const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const { connectDB } = require('./config/db');

const app = express();

app.use(cors({ origin: [process.env.FRONTEND_ORIGIN || 'http://localhost:4200'], credentials: true }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/members', require('./routes/member.routes'));
app.use('/api/trainers', require('./routes/trainer.routes'));
app.use('/api/plans', require('./routes/plan.routes'));
app.use('/api/membership', require('./routes/membership.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/classes', require('./routes/classes.routes'));
app.use('/api/workouts', require('./routes/workout.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'GymPro X API running', time: new Date().toISOString() });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;