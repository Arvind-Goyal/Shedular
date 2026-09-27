const mongoose = require('mongoose');

const StudyTaskSchema = new mongoose.Schema({
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
  topicId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Topic',
    default: null
  },
  topicName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['lecture', 'revision', 'practice', 'mock_test', 'pyq'],
    default: 'lecture'
  },
  lectureNumber: {
    type: Number,
    default: null
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 90
  },
  title: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    default: null
  },
  endTime: {
    type: String,
    default: null
  },
  timeSlot: {
    type: String,
    default: null
  },
  slotName: {
    type: String,
    default: null
  },
  completed: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: {
    type: Date,
    default: null
  },
  skipped: {
    type: Boolean,
    default: false
  },
  isManual: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudyTask', StudyTaskSchema);
