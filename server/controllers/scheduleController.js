const StudyTask = require('../models/StudyTask');
const Topic = require('../models/Topic');
const User = require('../models/User');
const SchedulerEngine = require('../services/scheduler/schedulerEngine');
const Rescheduler = require('../services/scheduler/rescheduler');
const ProgressCalculator = require('../services/scheduler/progressCalculator');
const { calculateWorkload, formatDate, parseDate } = require('../services/scheduler/workloadCalculator');

// Get full schedule overview
exports.getSchedule = async (req, res) => {
  try {
    const user = req.user;
    const todayDate = req.query.today || formatDate(new Date());

    const topics = await Topic.find({ userId: user._id }).sort({ priorityOrder: 1 });
    const allTasks = await StudyTask.find({ userId: user._id }).sort({ date: 1, lectureNumber: 1 });

    // Workload calculation
    const workload = calculateWorkload({
      startDate: user.startDate,
      targetExamDate: user.targetExamDate,
      dailyStudyHours: user.dailyStudyHours,
      lectureDuration: user.lectureDuration,
      weeklyRevisionDays: user.weeklyRevisionDays,
      topics,
      blackoutPeriods: user.blackoutPeriods
    });

    // Schedule status (ahead / behind / on_track)
    const scheduleStatus = Rescheduler.evaluateScheduleStatus({
      todayDate,
      tasks: allTasks,
      topics,
      userSettings: user
    });

    // Group tasks by date with deduplication
    const tasksByDate = {};
    for (const t of allTasks) {
      if (!tasksByDate[t.date]) tasksByDate[t.date] = [];
      const isDuplicate = tasksByDate[t.date].some(existing =>
        (existing._id && t._id && existing._id.toString() === t._id.toString()) ||
        (existing.type === 'lecture' && t.type === 'lecture' && existing.lectureNumber === t.lectureNumber && existing.topicName === t.topicName)
      );
      if (!isDuplicate) {
        tasksByDate[t.date].push(t);
      }
    }

    // Comprehensive progress
    const progress = ProgressCalculator.computeProgress({
      topics,
      tasks: allTasks,
      user,
      todayDate
    });

    res.json({
      workload,
      scheduleStatus,
      progress,
      tasksByDate,
      userSettings: {
        startDate: user.startDate,
        targetExamDate: user.targetExamDate,
        dailyStudyHours: user.dailyStudyHours,
        lectureDuration: user.lectureDuration,
        weeklyRevisionDays: user.weeklyRevisionDays,
        blackoutPeriods: user.blackoutPeriods,
        streak: user.streak
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch schedule', error: error.message });
  }
};

// Get Today's Plan
exports.getTodayPlan = async (req, res) => {
  try {
    const user = req.user;
    const targetDate = req.query.date || formatDate(new Date());

    const tasks = await StudyTask.find({
      userId: user._id,
      date: targetDate
    }).sort({ lectureNumber: 1, createdAt: 1 });

    // Pending backlog tasks from earlier dates that are still incomplete
    const backlogTasks = await StudyTask.find({
      userId: user._id,
      date: { $lt: targetDate },
      completed: false,
      skipped: false
    }).sort({ date: 1, lectureNumber: 1 });

    const topics = await Topic.find({ userId: user._id });

    // Check if targetDate is a revision or blackout day
    const workload = calculateWorkload({
      startDate: user.startDate,
      targetExamDate: user.targetExamDate,
      dailyStudyHours: user.dailyStudyHours,
      lectureDuration: user.lectureDuration,
      weeklyRevisionDays: user.weeklyRevisionDays,
      topics,
      blackoutPeriods: user.blackoutPeriods
    });

    const dayMeta = workload.allDays.find(d => d.dateStr === targetDate) || {
      isRevision: false,
      isBlackout: false,
      blackoutReason: null
    };

    // Deduplicate tasks
    const uniqueTasks = [];
    const seen = new Set();
    for (const t of tasks) {
      const key = `${t.type}_${t.lectureNumber || t.title}_${t.topicName}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTasks.push(t);
      }
    }

    const plannedMinutes = uniqueTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
    const completedMinutes = uniqueTasks.filter(t => t.completed).reduce((sum, t) => sum + (t.durationMinutes || 0), 0);

    res.json({
      date: targetDate,
      targetHours: user.dailyStudyHours,
      lectureDuration: user.lectureDuration,
      plannedMinutes,
      completedMinutes,
      isCompleted: plannedMinutes > 0 && completedMinutes >= plannedMinutes,
      isRevision: dayMeta.isRevision,
      isBlackout: dayMeta.isBlackout,
      blackoutReason: dayMeta.blackoutReason,
      tasks: uniqueTasks,
      backlogTasks,
      topics: topics.map(t => ({ _id: t._id, name: t.name, difficulty: t.difficulty, completedLectures: t.completedLectures, totalLectures: t.totalLectures }))
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch today's plan", error: error.message });
  }
};

// Get monthly calendar with visual badges:
// 🟢 Completed, 🟡 Partially completed, 🔴 Missed, 🔵 Revision day, ⚪ Future study day
exports.getCalendar = async (req, res) => {
  try {
    const user = req.user;
    const { month, year } = req.query;
    const now = new Date();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();
    const targetMonth = month ? parseInt(month, 10) : (now.getMonth() + 1);

    // Format start and end dates of the requested month
    const startOfMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
    const lastDayOfMonth = new Date(targetYear, targetMonth, 0).getDate();
    const endOfMonth = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`;

    const tasks = await StudyTask.find({
      userId: user._id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    }).sort({ date: 1 });

    const topics = await Topic.find({ userId: user._id });

    const workload = calculateWorkload({
      startDate: user.startDate,
      targetExamDate: user.targetExamDate,
      dailyStudyHours: user.dailyStudyHours,
      lectureDuration: user.lectureDuration,
      weeklyRevisionDays: user.weeklyRevisionDays,
      topics,
      blackoutPeriods: user.blackoutPeriods
    });

    const dayMetaMap = new Map();
    for (const d of workload.allDays) {
      dayMetaMap.set(d.dateStr, d);
    }

    const todayStr = req.query.today || formatDate(now);
    const calendarDays = [];

    // Group tasks by date with deduplication
    const tasksByDate = {};
    for (const t of tasks) {
      if (!tasksByDate[t.date]) tasksByDate[t.date] = [];
      const isDuplicate = tasksByDate[t.date].some(existing =>
        (existing._id && t._id && existing._id.toString() === t._id.toString()) ||
        (existing.type === 'lecture' && t.type === 'lecture' && existing.lectureNumber === t.lectureNumber && existing.topicName === t.topicName)
      );
      if (!isDuplicate) {
        tasksByDate[t.date].push(t);
      }
    }

    for (let day = 1; day <= lastDayOfMonth; day++) {
      const dateStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTasks = tasksByDate[dateStr] || [];
      const dayMeta = dayMetaMap.get(dateStr) || { isRevision: false, isBlackout: false, blackoutReason: null };

      const totalPlanned = dayTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
      const totalCompleted = dayTasks.filter(t => t.completed).reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
      const allCompleted = dayTasks.length > 0 && dayTasks.every(t => t.completed);
      const anyCompleted = dayTasks.some(t => t.completed);

      // Determine badge status:
      // 'completed' (🟢), 'partial' (🟡), 'missed' (🔴), 'revision' (🔵), 'future' (⚪), 'blackout' (⛔)
      let status = 'future';

      if (dayMeta.isBlackout) {
        status = 'blackout';
      } else if (allCompleted && dayTasks.length > 0) {
        status = 'completed';
      } else if (anyCompleted) {
        status = 'partial';
      } else if (dateStr < todayStr && dayTasks.length > 0 && !allCompleted) {
        status = 'missed';
      } else if (dayMeta.isRevision) {
        status = 'revision';
      } else if (dateStr >= todayStr) {
        status = 'future';
      }

      calendarDays.push({
        date: dateStr,
        dayNumber: day,
        status,
        isToday: dateStr === todayStr,
        isRevision: dayMeta.isRevision,
        isBlackout: dayMeta.isBlackout,
        blackoutReason: dayMeta.blackoutReason,
        totalTasks: dayTasks.length,
        completedTasks: dayTasks.filter(t => t.completed).length,
        uncompletedTasksCount: dayTasks.filter(t => !t.completed).length,
        hasIncomplete: dayTasks.some(t => !t.completed),
        plannedMinutes: totalPlanned,
        completedMinutes: totalCompleted,
        tasks: dayTasks
      });
    }

    res.json({
      year: targetYear,
      month: targetMonth,
      calendarDays
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch calendar', error: error.message });
  }
};

// Recalculate full schedule
exports.recalculateSchedule = async (req, res) => {
  try {
    const user = req.user;
    // Determine effective starting date (never before user.startDate unless explicitly requested)
    const effectiveStartDate = (req.body.fromDate && req.body.fromDate >= user.startDate)
      ? req.body.fromDate
      : user.startDate;

    const topics = await Topic.find({ userId: user._id }).sort({ priorityOrder: 1 });
    const completedTasks = await StudyTask.find({ userId: user._id, completed: true });

    // Accurately map completed lecture count per topic
    const completedCountsByTopic = new Map();
    for (const t of completedTasks) {
      if (t.type === 'lecture' && t.topicId) {
        const idStr = t.topicId.toString();
        completedCountsByTopic.set(idStr, (completedCountsByTopic.get(idStr) || 0) + 1);
      }
    }

    const effectiveTopics = topics.map(top => {
      const topObj = top.toObject ? top.toObject() : top;
      const count = completedCountsByTopic.get(topObj._id.toString()) || 0;
      return {
        ...topObj,
        completedLectures: count
      };
    });

    // Remove uncompleted tasks from effectiveStartDate forward
    await StudyTask.deleteMany({
      userId: user._id,
      completed: false,
      date: { $gte: effectiveStartDate }
    });

    // Run scheduler engine
    const generated = SchedulerEngine.generateSchedule({
      userSettings: {
        startDate: effectiveStartDate,
        targetExamDate: user.targetExamDate,
        dailyStudyHours: user.dailyStudyHours,
        lectureDuration: user.lectureDuration,
        weeklyRevisionDays: user.weeklyRevisionDays,
        blackoutPeriods: user.blackoutPeriods
      },
      topics: effectiveTopics,
      existingCompletedTasks: completedTasks
    });

    const newTasks = [];
    for (const day of generated.scheduleDays) {
      if (day.date >= effectiveStartDate) {
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
              startTime: t.startTime || null,
              endTime: t.endTime || null,
              timeSlot: t.timeSlot || null,
              slotName: t.slotName || null,
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

    res.json({
      message: 'Schedule recalculated and balanced successfully',
      workload: generated.workload,
      isFeasible: generated.isFeasible,
      feasibilityMessage: generated.feasibilityMessage,
      suggestions: generated.suggestions
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to recalculate schedule', error: error.message });
  }
};

// Optimize schedule (when ahead of schedule)
exports.optimizeSchedule = async (req, res) => {
  try {
    const user = req.user;
    const { mode } = req.body; // 'reduce_hours' or 'finish_earlier'

    const topics = await Topic.find({ userId: user._id }).sort({ priorityOrder: 1 });
    const todayDate = formatDate(new Date());

    if (mode === 'reduce_hours') {
      // Calculate how much daily hours can be relaxed
      const completedLectures = topics.reduce((s, t) => s + (t.completedLectures || 0), 0);
      const totalLectures = topics.reduce((s, t) => s + (t.totalLectures || 0), 0);
      const remaining = Math.max(0, totalLectures - completedLectures);

      // Relax study hours if feasible, e.g. from 3.5 to 2.5
      if (user.dailyStudyHours > 2.0) {
        user.dailyStudyHours = Math.max(2.0, Number((user.dailyStudyHours - 0.5).toFixed(1)));
        await user.save();
      }
    }

    // Rebalance
    const completedTasks = await StudyTask.find({ userId: user._id, completed: true });
    await StudyTask.deleteMany({
      userId: user._id,
      completed: false,
      date: { $gte: todayDate }
    });

    const generated = SchedulerEngine.generateSchedule({
      userSettings: {
        startDate: todayDate,
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
      if (day.date >= todayDate) {
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

    res.json({
      message: mode === 'reduce_hours' 
        ? `Workload optimized! Daily study hours adjusted to ${user.dailyStudyHours}h.`
        : 'Schedule condensed to complete syllabus earlier!',
      user
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to optimize schedule', error: error.message });
  }
};
