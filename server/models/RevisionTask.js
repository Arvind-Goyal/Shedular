const mongoose = require('mongoose');

const RevisionTaskSchema = new mongoose.Schema({
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
  subActivity: {
    type: String,
    enum: ['formulas', 'pyqs', 'practice', 'concept_review', 'mock'],
    default: 'practice'
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 45
  },
  title: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RevisionTask', RevisionTaskSchema);
