const mongoose = require('mongoose');

const DailyProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true
  },
  plannedMinutes: {
    type: Number,
    default: 0
  },
  completedMinutes: {
    type: Number,
    default: 0
  },
  completionPercentage: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['completed', 'partial', 'missed', 'rest', 'future', 'revision'],
    default: 'future'
  },
  lecturesCompleted: {
    type: Number,
    default: 0
  },
  practiceMinutes: {
    type: Number,
    default: 0
  },
  revisionMinutes: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

DailyProgressSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyProgress', DailyProgressSchema);
