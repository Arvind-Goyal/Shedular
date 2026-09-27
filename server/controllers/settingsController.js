const User = require('../models/User');
const Topic = require('../models/Topic');
const StudyTask = require('../models/StudyTask');
const SchedulerEngine = require('../services/scheduler/schedulerEngine');
const { INITIAL_SYLLABUS } = require('../seed/initialSeed');
const { formatDate } = require('../services/scheduler/workloadCalculator');

// Get settings
exports.getSettings = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      dailyStudyHours: user.dailyStudyHours,
      lectureDuration: user.lectureDuration,
      weeklyRevisionDays: user.weeklyRevisionDays,
      startDate: user.startDate,
      targetExamDate: user.targetExamDate,
      blackoutPeriods: user.blackoutPeriods || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const user = req.user;
    const {
      dailyStudyHours,
      lectureDuration,
      weeklyRevisionDays,
      startDate,
      targetExamDate,
      blackoutPeriods,
      autoRecalculate = true
    } = req.body;

    if (dailyStudyHours !== undefined) user.dailyStudyHours = Number(dailyStudyHours);
    if (lectureDuration !== undefined) user.lectureDuration = Number(lectureDuration);
    if (weeklyRevisionDays !== undefined) user.weeklyRevisionDays = Number(weeklyRevisionDays);
    if (startDate) user.startDate = startDate;
    if (targetExamDate) user.targetExamDate = targetExamDate;
    if (blackoutPeriods) user.blackoutPeriods = blackoutPeriods;

    await user.save();

    if (autoRecalculate) {
      const todayStr = formatDate(new Date());
      const topics = await Topic.find({ userId: user._id }).sort({ priorityOrder: 1 });
      const completedTasks = await StudyTask.find({ userId: user._id, completed: true });

      // Delete future uncompleted tasks
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

      return res.json({
        message: 'Settings updated and schedule recalculated successfully',
        user: {
          dailyStudyHours: user.dailyStudyHours,
          lectureDuration: user.lectureDuration,
          weeklyRevisionDays: user.weeklyRevisionDays,
          startDate: user.startDate,
          targetExamDate: user.targetExamDate,
          blackoutPeriods: user.blackoutPeriods
        },
        workload: generated.workload,
        isFeasible: generated.isFeasible,
        feasibilityMessage: generated.feasibilityMessage,
        suggestions: generated.suggestions
      });
    }

    res.json({ message: 'Settings saved', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
};

// Reset everything to default initial syllabus
exports.resetToDefaults = async (req, res) => {
  try {
    const user = req.user;
    const currentYear = new Date().getFullYear();

    user.dailyStudyHours = 3.5;
    user.lectureDuration = 1.5;
    user.weeklyRevisionDays = 2;
    user.startDate = `${currentYear}-09-28`;
    user.targetExamDate = `${currentYear + 1}-05-31`;
    user.blackoutPeriods = [
      {
        startDate: `${currentYear}-10-04`,
        endDate: `${currentYear}-10-27`,
        reason: 'End Sem Exam (No Study)'
      }
    ];
    await user.save();

    // Clear old topics and tasks
    await Topic.deleteMany({ userId: user._id });
    await StudyTask.deleteMany({ userId: user._id });

    // Seed syllabus
    const topicDocs = INITIAL_SYLLABUS.map(t => ({
      userId: user._id,
      name: t.name,
      totalLectures: t.totalLectures,
      completedLectures: 0,
      difficulty: t.difficulty,
      priorityOrder: t.priorityOrder
    }));
    const newTopics = await Topic.insertMany(topicDocs);

    // Generate fresh schedule
    const generated = SchedulerEngine.generateSchedule({
      userSettings: {
        startDate: user.startDate,
        targetExamDate: user.targetExamDate,
        dailyStudyHours: user.dailyStudyHours,
        lectureDuration: user.lectureDuration,
        weeklyRevisionDays: user.weeklyRevisionDays,
        blackoutPeriods: user.blackoutPeriods
      },
      topics: newTopics
    });

    const tasksToInsert = [];
    for (const day of generated.scheduleDays) {
      for (const t of day.tasks) {
        tasksToInsert.push({
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

    if (tasksToInsert.length > 0) {
      await StudyTask.insertMany(tasksToInsert);
    }

    res.json({ message: 'Reset to initial SSC CHSL 99-lecture syllabus complete!', user });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset data', error: error.message });
  }
};
