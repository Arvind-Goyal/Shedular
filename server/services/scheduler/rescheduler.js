const { calculateWorkload, formatDate, parseDate } = require('./workloadCalculator');

/**
 * Rescheduler
 * Handles dynamic rescheduling when days are missed, partially completed,
 * or when extra work is completed ahead of time.
 */
class Rescheduler {
  /**
   * Evaluates schedule status relative to a specific reference date (typically today)
   * @param {Object} params
   * @param {string} params.todayDate - YYYY-MM-DD
   * @param {Array} params.tasks - All tasks for the user
   * @param {Array} params.topics - All topics with completedLectures
   * @param {Object} params.userSettings
   */
  static evaluateScheduleStatus({ todayDate, tasks = [], topics = [], userSettings }) {
    // 1. Find past incomplete tasks (prior to todayDate)
    const missedPastTasks = tasks.filter(t => 
      t.date < todayDate && 
      !t.completed && 
      !t.skipped &&
      t.type === 'lecture'
    );

    // 2. Count total completed lectures vs expected completed lectures up to today
    let totalCompletedLectures = 0;
    for (const t of topics) {
      totalCompletedLectures += (t.completedLectures || 0);
    }

    const scheduledLecturesUpToToday = tasks.filter(t => 
      t.date <= todayDate && 
      t.type === 'lecture'
    ).length;

    const completedLecturesUpToToday = tasks.filter(t =>
      t.date <= todayDate &&
      t.type === 'lecture' &&
      t.completed
    ).length;

    // Ahead / Behind status
    let status = 'on_track';
    let aheadLectures = 0;
    let behindLectures = 0;
    let message = 'You are on track with your study plan!';

    if (missedPastTasks.length > 0) {
      behindLectures = missedPastTasks.length;
      status = 'behind';
      message = `You have ${behindLectures} missed lecture${behindLectures > 1 ? 's' : ''} from previous days. Your future schedule can be automatically adjusted to catch up smoothly.`;
    } else if (completedLecturesUpToToday > scheduledLecturesUpToToday) {
      aheadLectures = completedLecturesUpToToday - scheduledLecturesUpToToday;
      status = 'ahead';
      message = `You are ahead of schedule by ${aheadLectures} lecture${aheadLectures > 1 ? 's' : ''}!`;
    }

    return {
      status,
      aheadLectures,
      behindLectures,
      missedPastTasks,
      message,
      canOptimize: status === 'ahead'
    };
  }

  /**
   * Reschedules future tasks starting from a date (e.g. today or tomorrow)
   * Intelligently redistributes uncompleted work across available days without overloading.
   */
  static rebalanceSchedule({
    fromDate,
    userSettings,
    topics,
    completedTasks = [],
    uncompletedTasks = []
  }) {
    // Workload calculation starting from fromDate
    const { dailyStudyHours = 3.5, lectureDuration = 1.5, weeklyRevisionDays = 2, targetExamDate, blackoutPeriods = [] } = userSettings;

    // Remaining lectures needed across all topics
    // We update topics' completed count from existing completedTasks
    const completedCountsByTopic = {};
    for (const task of completedTasks) {
      if (task.completed && task.type === 'lecture' && task.topicId) {
        const id = task.topicId.toString();
        completedCountsByTopic[id] = (completedCountsByTopic[id] || 0) + 1;
      }
    }

    const updatedTopics = topics.map(top => {
      const topObj = top.toObject ? top.toObject() : { ...top };
      const comp = completedCountsByTopic[topObj._id ? topObj._id.toString() : ''] || topObj.completedLectures || 0;
      return {
        ...topObj,
        completedLectures: comp
      };
    });

    // Use SchedulerEngine logic from fromDate to targetExamDate
    const SchedulerEngine = require('./schedulerEngine');
    const result = SchedulerEngine.generateSchedule({
      userSettings: {
        ...userSettings,
        startDate: fromDate
      },
      topics: updatedTopics,
      existingCompletedTasks: completedTasks.filter(t => t.date >= fromDate)
    });

    return result;
  }
}

module.exports = Rescheduler;
