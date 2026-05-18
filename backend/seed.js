require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User.model');
const Plan = require('./models/Plan.model');
const Trainer = require('./models/Trainer.model');
const Member = require('./models/Member.model');
const Payment = require('./models/Payment.model');
const Attendance = require('./models/Attendance.model');
const Membership = require('./models/Membership.model');
const Notification = require('./models/Notification.model');
const Workout = require('./models/Workout.model');
const ClassModel = require('./models/Class.model');
const { addMonths, startOfDay } = require('./utils/date.util');

async function clearCollections() {
  await Promise.all([
    User.deleteMany({}),
    Plan.deleteMany({}),
    Trainer.deleteMany({}),
    Member.deleteMany({}),
    Payment.deleteMany({}),
    Attendance.deleteMany({}),
    Membership.deleteMany({}),
    Notification.deleteMany({}),
    Workout.deleteMany({}),
    ClassModel.deleteMany({})
  ]);
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await clearCollections();
  console.log('Cleared existing data');

  const [adminUser, memberUser] = await User.create([
    { name: 'Admin User', email: 'admin@gym.com', password: 'admin123', role: 'admin', phone: '9999999999' },
    { name: 'Rahul Sharma', email: 'user@gym.com', password: 'user123', role: 'member', phone: '8888888888' }
  ]);

  const plans = await Plan.create([
    { name: 'Basic', duration: 1, price: 999, features: ['Gym Access', 'Locker Room'] },
    { name: 'Standard', duration: 3, price: 2499, features: ['Gym Access', 'Locker Room', 'Cardio Zone'] },
    { name: 'Premium', duration: 6, price: 4499, features: ['All Access', 'Personal Trainer', 'Diet Plan'] },
    { name: 'Elite', duration: 12, price: 7999, features: ['All Access', 'Personal Trainer', 'Diet Plan', 'Supplements'] }
  ]);

  const trainers = await Trainer.create([
    { name: 'Karan Mehta', email: 'karan@gym.com', phone: '9111111111', specialty: 'Strength Training', shift: 'Morning', experience: 5 },
    { name: 'Priya Singh', email: 'priya@gym.com', phone: '9222222222', specialty: 'Yoga & Flexibility', shift: 'Evening', experience: 4 },
    { name: 'Arjun Patel', email: 'arjun@gym.com', phone: '9333333333', specialty: 'Cardio & HIIT', shift: 'Morning', experience: 6 }
  ]);

  const memberData = [
    {
      user: memberUser._id,
      memberId: 'M0001',
      name: 'Rahul Sharma',
      email: 'user@gym.com',
      phone: '8888888888',
      gender: 'Male',
      plan: plans[2]._id,
      trainer: trainers[0]._id,
      joinDate: new Date('2026-01-10'),
      expiryDate: new Date('2026-07-10'),
      feeStatus: 'Paid',
      status: 'Active'
    },
    {
      memberId: 'M0002',
      name: 'Priya Patel',
      email: 'priya@test.com',
      phone: '8002222222',
      gender: 'Female',
      plan: plans[1]._id,
      trainer: trainers[1]._id,
      joinDate: new Date('2026-02-15'),
      expiryDate: new Date('2026-05-15'),
      feeStatus: 'Paid',
      status: 'Expired'
    },
    {
      memberId: 'M0003',
      name: 'Amit Kumar',
      email: 'amit@test.com',
      phone: '8003333333',
      gender: 'Male',
      plan: plans[3]._id,
      trainer: trainers[2]._id,
      joinDate: new Date('2026-03-01'),
      expiryDate: new Date('2027-03-01'),
      feeStatus: 'Pending',
      status: 'Active'
    }
  ];

  const members = await Member.create(memberData);

  const memberships = await Membership.create([
    {
      memberId: members[0]._id,
      planId: plans[2]._id,
      startDate: new Date('2026-01-10'),
      expiryDate: new Date('2026-07-10'),
      status: 'Active',
      purchaseType: 'buy',
      amount: plans[2].price
    },
    {
      memberId: members[1]._id,
      planId: plans[1]._id,
      startDate: new Date('2026-02-15'),
      expiryDate: new Date('2026-05-15'),
      status: 'Expired',
      purchaseType: 'buy',
      amount: plans[1].price
    },
    {
      memberId: members[2]._id,
      planId: plans[3]._id,
      startDate: new Date('2026-03-01'),
      expiryDate: new Date('2027-03-01'),
      status: 'Active',
      purchaseType: 'buy',
      amount: plans[3].price
    }
  ]);

  await Payment.create([
    {
      invoiceNo: 'INV-000001',
      member: members[0]._id,
      plan: plans[2]._id,
      membership: memberships[0]._id,
      amount: 4499,
      method: 'UPI',
      status: 'Paid',
      transactionType: 'buy',
      date: new Date('2026-01-10')
    },
    {
      invoiceNo: 'INV-000002',
      member: members[1]._id,
      plan: plans[1]._id,
      membership: memberships[1]._id,
      amount: 2499,
      method: 'Cash',
      status: 'Paid',
      transactionType: 'buy',
      date: new Date('2026-02-15')
    },
    {
      invoiceNo: 'INV-000003',
      member: members[2]._id,
      plan: plans[3]._id,
      membership: memberships[2]._id,
      amount: 7999,
      method: 'Card',
      status: 'Paid',
      transactionType: 'buy',
      date: new Date('2026-03-01')
    }
  ]);

  const today = new Date();
  for (let i = 0; i < 12; i += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const date = startOfDay(day);
    await Attendance.create({
      memberId: members[0]._id,
      date,
      checkInTime: new Date(date.getTime() + 6 * 60 * 60 * 1000 + 30 * 60 * 1000),
      status: 'Present'
    });
  }

  await Workout.create([
    { memberId: members[0]._id, workoutName: 'Upper Body Strength', calories: 420, duration: 50, date: new Date() },
    { memberId: members[0]._id, workoutName: 'Cardio Run', calories: 320, duration: 35, date: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { memberId: members[0]._id, workoutName: 'Leg Day', calories: 480, duration: 55, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
  ]);

  await ClassModel.create([
    {
      title: 'Morning Strength Bootcamp',
      description: 'Full body session focused on strength and endurance.',
      trainerId: trainers[0]._id,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMinutes: 60,
      capacity: 25
    },
    {
      title: 'Evening Yoga Recovery',
      description: 'Mobility and stretching session for recovery.',
      trainerId: trainers[1]._id,
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      durationMinutes: 45,
      capacity: 20
    },
    {
      title: 'HIIT Blast',
      description: 'High intensity circuit for fat loss.',
      trainerId: trainers[2]._id,
      scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      durationMinutes: 40,
      capacity: 30
    }
  ]);

  await Notification.create([
    {
      memberId: members[0]._id,
      title: 'Membership Renewal Reminder',
      message: `Your membership expires on ${members[0].expiryDate.toDateString()}. Renew early to continue access.`,
      type: 'membership-expiry',
      isRead: false
    },
    {
      memberId: members[0]._id,
      title: 'Class Reminder',
      message: 'You have Morning Strength Bootcamp tomorrow at 6:00 AM.',
      type: 'class-reminder',
      isRead: false
    },
    {
      memberId: members[0]._id,
      title: 'Payment Reminder',
      message: 'Keep auto-renewal enabled to avoid service interruptions.',
      type: 'payment-reminder',
      isRead: true
    }
  ]);

  // Keep membership status in sync for sample members
  members[0].expiryDate = addMonths(new Date(), 4);
  members[0].status = 'Active';
  await members[0].save();

  console.log('Seed complete');
  console.log('Admin login: admin@gym.com / admin123');
  console.log('Member login: user@gym.com / user123');

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
});
