const Topic = require('../models/Topic');
const StudyTask = require('../models/StudyTask');
const SchedulerEngine = require('../services/scheduler/schedulerEngine');
const { formatDate } = require('../services/scheduler/workloadCalculator');

// Helper to rebuild future uncompleted schedule
async function refreshFutureSchedule(user) {
  const topics = await Topic.find({ userId: user._id }).sort({ priorityOrder: 1 });
  const completedTasks = await StudyTask.find({ userId: user._id, completed: true });

  // Delete only future uncompleted tasks
  const todayStr = formatDate(new Date());
  await StudyTask.deleteMany({
    userId: user._id,
    completed: false,
    date: { $gte: todayStr }
  });

  const generated = SchedulerEngine.generateSchedule({
    userSettings: {
      startDate: todayStr,
      targetExamDate: user.targetExamDate,
      dailyStudyHours: user.dailyStudyHours,
      lectureDuration: user.lectureDuration,
      weeklyRevisionDays: user.weeklyRevisionDays,
      blackoutPeriods: user.blackoutPeriods
    },
    topics,
    existingCompletedTasks: completedTasks
  });

  const newTasks = [];
  for (const day of generated.scheduleDays) {
    if (day.date >= todayStr) {
      for (const t of day.tasks) {
        if (!t.completed) {
          newTasks.push({
            userId: user._id,
            date: t.date,
            topicId: t.topicId,
            topicName: t.topicName,
            type: t.type,
            lectureNumber: t.lectureNumber || null,
            durationMinutes: t.durationMinutes,
            title: t.title,
            completed: false,
            isManual: false
          });
        }
      }
    }
  }

  if (newTasks.length > 0) {
    await StudyTask.insertMany(newTasks);
  }
}

// Get all topics
exports.getTopics = async (req, res) => {
  try {
    const topics = await Topic.find({ userId: req.user._id }).sort({ priorityOrder: 1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch topics', error: error.message });
  }
};

// Get single topic details with associated tasks
exports.getTopicById = async (req, res) => {
  try {
    const topic = await Topic.findOne({ _id: req.params.id, userId: req.user._id });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const tasks = await StudyTask.find({
      userId: req.user._id,
      topicId: topic._id
    }).sort({ date: 1, lectureNumber: 1 });

    const total = topic.totalLectures;
    const completed = topic.completedLectures;
    const remaining = Math.max(0, total - completed);
    const estimatedHours = Number((remaining * (req.user.lectureDuration || 1.5)).toFixed(1));

    res.json({
      topic,
      stats: {
        totalLectures: total,
        completedLectures: completed,
        remainingLectures: remaining,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        estimatedRemainingHours: estimatedHours
      },
      tasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch topic', error: error.message });
  }
};

// Add new topic
exports.createTopic = async (req, res) => {
  try {
    const { name, totalLectures, difficulty, priorityOrder } = req.body;
    const maxOrderTopic = await Topic.findOne({ userId: req.user._id }).sort({ priorityOrder: -1 });
    const nextOrder = priorityOrder || (maxOrderTopic ? maxOrderTopic.priorityOrder + 1 : 1);

    const topic = await Topic.create({
      userId: req.user._id,
      name: name.trim(),
      totalLectures: Number(totalLectures) || 10,
      completedLectures: 0,
      difficulty: difficulty || 'Medium',
      priorityOrder: nextOrder
    });

    // Auto-rebalance future schedule with the new topic
    await refreshFutureSchedule(req.user);

    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create topic', error: error.message });
  }
};

// Update topic (name, totalLectures, difficulty, priority)
exports.updateTopic = async (req, res) => {
  try {
    const { name, totalLectures, difficulty, priorityOrder, notes } = req.body;

    const topic = await Topic.findOne({ _id: req.params.id, userId: req.user._id });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    if (name) topic.name = name.trim();
    if (totalLectures !== undefined) topic.totalLectures = Math.max(1, Number(totalLectures));
    if (difficulty) topic.difficulty = difficulty;
    if (priorityOrder !== undefined) topic.priorityOrder = Number(priorityOrder);
    if (notes !== undefined) topic.notes = notes;

    await topic.save();

    // Auto rebalance schedule
    await refreshFutureSchedule(req.user);

    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update topic', error: error.message });
  }
};

// Delete topic
exports.deleteTopic = async (req, res) => {
  try {
    const topic = await Topic.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    // Delete tasks associated with this topic that aren't completed
    await StudyTask.deleteMany({
      userId: req.user._id,
      topicId: topic._id,
      completed: false
    });

    // Rebalance future schedule
    await refreshFutureSchedule(req.user);

    res.json({ message: 'Topic deleted and schedule rebalanced', id: req.params.id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete topic', error: error.message });
  }
};
