const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Aspirant'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  dailyStudyHours: {
    type: Number,
    default: 3.5,
    min: 0.5,
    max: 16
  },
  lectureDuration: {
    type: Number,
    default: 1.5,
    min: 0.25,
    max: 6
  },
  weeklyRevisionDays: {
    type: Number,
    default: 2,
    min: 0,
    max: 4
  },
  startDate: {
    type: String,
    default: () => {
      const now = new Date();
      const year = now.getFullYear();
      return `${year}-09-28`;
    }
  },
  targetExamDate: {
    type: String,
    default: () => {
      const now = new Date();
      const year = now.getFullYear();
      // Target around June next year or 2026/2027 depending on start
      return `${year + 1}-05-31`;
    }
  },
  blackoutPeriods: [
    {
      startDate: { type: String, required: true },
      endDate: { type: String, required: true },
      reason: { type: String, default: 'Exam Period / Break' }
    }
  ],
  streak: {
    current: { type: Number, default: 0 },
    longest: { type: Number, default: 0 },
    lastActiveDate: { type: String, default: null }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', UserSchema);
