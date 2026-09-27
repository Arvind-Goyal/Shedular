const StudyTask = require('../models/StudyTask');
const Topic = require('../models/Topic');
const User = require('../models/User');
const { formatDate } = require('../services/scheduler/workloadCalculator');

// Helper to update user streak
async function updateUserStreak(userId, taskDate) {
  const user = await User.findById(userId);
  if (!user) return;

  const todayStr = formatDate(new Date());
  if (!user.streak) {
    user.streak = { current: 1, longest: 1, lastActiveDate: taskDate };
  } else {
    const lastActive = user.streak.lastActiveDate;
    if (lastActive === taskDate) {
      // Already credited today
    } else if (lastActive) {
      const yesterday = new Date(taskDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = formatDate(yesterday);

      if (lastActive === yesterdayStr) {
        user.streak.current += 1;
        if (user.streak.current > user.streak.longest) {
          user.streak.longest = user.streak.current;
        }
      } else {
        user.streak.current = 1;
      }
      user.streak.lastActiveDate = taskDate;
    } else {
      user.streak.current = 1;
      user.streak.longest = Math.max(1, user.streak.longest || 1);
      user.streak.lastActiveDate = taskDate;
    }
  }
  await user.save();
}

// Get tasks with filtering (by date, date range, completed, topicId)
exports.getTasks = async (req, res) => {
  try {
    const { date, startDate, endDate, completed, topicId } = req.query;
    const query = { userId: req.user._id };

    if (date) query.date = date;
    if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
    if (completed !== undefined) query.completed = completed === 'true';
    if (topicId) query.topicId = topicId;

    const tasks = await StudyTask.find(query).sort({ date: 1, lectureNumber: 1, createdAt: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};

// Toggle or update task completion
exports.toggleTaskCompletion = async (req, res) => {
  try {
    const task = await StudyTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const newCompleted = req.body.completed !== undefined ? req.body.completed : !task.completed;
    task.completed = newCompleted;
    task.completedAt = newCompleted ? new Date() : null;

    if (task.completed) {
      task.skipped = false;
    }

    await task.save();

    // If it's a lecture, sync topic completedLectures count
    if (task.type === 'lecture' && task.topicId) {
      const topic = await Topic.findOne({ _id: task.topicId, userId: req.user._id });
      if (topic) {
        const count = await StudyTask.countDocuments({
          userId: req.user._id,
          topicId: topic._id,
          type: 'lecture',
          completed: true
        });
        topic.completedLectures = count;
        if (newCompleted) {
          topic.lastRevisedDate = task.date;
        }
        await topic.save();
      }
    }

    // Update streak if completing
    if (newCompleted) {
      await updateUserStreak(req.user._id, task.date);
    }

    res.json({ message: 'Task updated successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

// Quick log an activity (Topic Dropdown Section 8)
exports.quickLogActivity = async (req, res) => {
  try {
    const { topicId, topicName, activityType, durationMinutes, date, notes } = req.body;
    const taskDate = date || formatDate(new Date());

    let finalTopicName = topicName;
    let topicDoc = null;

    if (topicId) {
      topicDoc = await Topic.findOne({ _id: topicId, userId: req.user._id });
      if (topicDoc) {
        finalTopicName = topicDoc.name;
      }
    } else if (topicName) {
      topicDoc = await Topic.findOne({ name: topicName, userId: req.user._id });
    }

    const type = activityType || 'practice';
    const duration = Number(durationMinutes) || 45;

    // If activity is lecture, determine next lecture number
    let lectureNumber = null;
    if (type === 'lecture' && topicDoc) {
      const lastCompletedLecture = await StudyTask.findOne({
        userId: req.user._id,
        topicId: topicDoc._id,
        type: 'lecture',
        completed: true
      }).sort({ lectureNumber: -1 });

      lectureNumber = lastCompletedLecture && lastCompletedLecture.lectureNumber 
        ? lastCompletedLecture.lectureNumber + 1 
        : (topicDoc.completedLectures + 1);
    }

    const title = type === 'lecture'
      ? `${finalTopicName || 'Maths'} — Lecture ${lectureNumber || 1}`
      : `${finalTopicName || 'Maths'}: ${type.toUpperCase().replace('_', ' ')} (${duration} min)`;

    const task = await StudyTask.create({
      userId: req.user._id,
      date: taskDate,
      topicId: topicDoc ? topicDoc._id : null,
      topicName: finalTopicName || 'Mathematics',
      type: type,
      lectureNumber: lectureNumber,
      durationMinutes: duration,
      title: title,
      completed: true,
      completedAt: new Date(),
      isManual: true,
      notes: notes || ''
    });

    // Update topic completed lectures if applicable
    if (type === 'lecture' && topicDoc) {
      const count = await StudyTask.countDocuments({
        userId: req.user._id,
        topicId: topicDoc._id,
        type: 'lecture',
        completed: true
      });
      topicDoc.completedLectures = count;
      topicDoc.lastRevisedDate = taskDate;
      await topicDoc.save();
    }

    // Update user streak
    await updateUserStreak(req.user._id, taskDate);

    res.status(201).json({ message: 'Activity logged successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to log activity', error: error.message });
  }
};

// Edit task (title, duration, type, notes)
exports.updateTask = async (req, res) => {
  try {
    const { title, durationMinutes, type, notes, date } = req.body;
    const task = await StudyTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (title) task.title = title;
    if (durationMinutes) task.durationMinutes = Number(durationMinutes);
    if (type) task.type = type;
    if (notes !== undefined) task.notes = notes;
    if (date) task.date = date;

    await task.save();
    res.json({ message: 'Task updated', task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

// Move task to another date
exports.moveTask = async (req, res) => {
  try {
    const { newDate } = req.body;
    if (!newDate) {
      return res.status(400).json({ message: 'newDate is required' });
    }

    const task = await StudyTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.date = newDate;
    task.isManual = true;
    await task.save();

    res.json({ message: `Task moved to ${newDate}`, task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to move task', error: error.message });
  }
};

// Skip task
exports.skipTask = async (req, res) => {
  try {
    const task = await StudyTask.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.skipped = true;
    task.completed = false;
    await task.save();

    res.json({ message: 'Task marked as skipped', task });
  } catch (error) {
    res.status(500).json({ message: 'Failed to skip task', error: error.message });
  }
};

// Add manual task to any date
exports.createTask = async (req, res) => {
  try {
    const { date, topicId, topicName, type, durationMinutes, title, notes } = req.body;

    const task = await StudyTask.create({
      userId: req.user._id,
      date: date || formatDate(new Date()),
      topicId: topicId || null,
      topicName: topicName || 'Mathematics',
      type: type || 'practice',
      durationMinutes: Number(durationMinutes) || 45,
      title: title || 'Custom Practice Task',
      completed: false,
      isManual: true,
      notes: notes || ''
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add task', error: error.message });
  }
};

// Delete task
exports.deleteTask = async (req, res) => {
  try {
    const task = await StudyTask.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};
