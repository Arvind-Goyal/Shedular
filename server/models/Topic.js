const mongoose = require('mongoose');

const TopicSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  totalLectures: {
    type: Number,
    required: true,
    min: 1
  },
  completedLectures: {
    type: Number,
    default: 0,
    min: 0
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Difficult'],
    default: 'Medium'
  },
  priorityOrder: {
    type: Number,
    default: 1
  },
  lastRevisedDate: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Topic', TopicSchema);
