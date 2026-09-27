const { formatDate, parseDate } = require('./workloadCalculator');

/**
 * ProgressCalculator
 * Computes dashboard statistics, topic progress cards, weekly breakdowns, and study streak.
 */
class ProgressCalculator {
  /**
   * Computes comprehensive overall and topic progress
   * @param {Object} params
   * @param {Array} params.topics - All topics
   * @param {Array} params.tasks - All tasks
   * @param {Object} params.user - User document / settings
   * @param {string} params.todayDate - YYYY-MM-DD
   */
  static computeProgress({ topics = [], tasks = [], user = {}, todayDate }) {
    const lectureDuration = user.dailyStudyHours ? user.lectureDuration || 1.5 : 1.5;
    const dailyStudyHours = user.dailyStudyHours || 3.5;

    // 1. Topic breakdown
    let totalLectures = 0;
    let completedLectures = 0;

    const topicStats = topics.map(t => {
      const tot = t.totalLectures || 0;
      const comp = t.completedLectures || 0;
      const rem = Math.max(0, tot - comp);
      const remHours = Number((rem * lectureDuration).toFixed(1));
      const percentage = tot > 0 ? Math.round((comp / tot) * 100) : 0;

      totalLectures += tot;
      completedLectures += comp;

      return {
        _id: t._id,
        name: t.name,
        totalLectures: tot,
        completedLectures: comp,
        remainingLectures: rem,
        percentage,
        estimatedRemainingHours: remHours,
        difficulty: t.difficulty || 'Medium',
        priorityOrder: t.priorityOrder || 1,
        lastRevisedDate: t.lastRevisedDate || null
      };
    });

    const remainingLectures = Math.max(0, totalLectures - completedLectures);
    const overallPercentage = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;

    // Total hours calculation
    const totalStudyHours = Number((totalLectures * lectureDuration).toFixed(1));
    const completedStudyHours = Number((completedLectures * lectureDuration).toFixed(1));
    const remainingStudyHours = Number((remainingLectures * lectureDuration).toFixed(1));

    // 2. Today's progress
    const todayTasks = tasks.filter(t => t.date === todayDate);
    const todayPlannedMinutes = todayTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);
    const todayCompletedMinutes = todayTasks
      .filter(t => t.completed)
      .reduce((sum, t) => sum + (t.durationMinutes || 0), 0);

    const todayProgress = {
      date: todayDate,
      plannedHours: Number((todayPlannedMinutes / 60).toFixed(1)) || dailyStudyHours,
      completedHours: Number((todayCompletedMinutes / 60).toFixed(1)),
      remainingHours: Math.max(0, Number(((todayPlannedMinutes - todayCompletedMinutes) / 60).toFixed(1))),
      percentage: todayPlannedMinutes > 0 ? Math.round((todayCompletedMinutes / todayPlannedMinutes) * 100) : 0,
      tasksCount: todayTasks.length,
      completedTasksCount: todayTasks.filter(t => t.completed).length
    };

    // 3. Weekly progress (current week Mon-Sun)
    const today = parseDate(todayDate);
    const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
    // Distance to Monday
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(today);
    monday.setDate(monday.getDate() - distanceToMonday);

    const weekDays = [];
    let weekPlannedMinutes = 0;
    let weekCompletedMinutes = 0;
    let weekLecturesCompleted = 0;
    let weekRevisionCompletedMinutes = 0;
    let weekPracticeCompletedMinutes = 0;
    let weekMissedTasks = 0;

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const dStr = formatDate(d);

      const dayTasks = tasks.filter(t => t.date === dStr);
      const plannedMin = dayTasks.reduce((acc, t) => acc + (t.durationMinutes || 0), 0);
      const completedMin = dayTasks.filter(t => t.completed).reduce((acc, t) => acc + (t.durationMinutes || 0), 0);

      const completedCount = dayTasks.filter(t => t.completed).length;
      const missedCount = dayTasks.filter(t => !t.completed && dStr < todayDate).length;

      // Classify activities completed
      for (const t of dayTasks.filter(x => x.completed)) {
        if (t.type === 'lecture') weekLecturesCompleted++;
        else if (t.type === 'revision' || t.type === 'pyq') weekRevisionCompletedMinutes += (t.durationMinutes || 0);
        else if (t.type === 'practice') weekPracticeCompletedMinutes += (t.durationMinutes || 0);
      }

      weekPlannedMinutes += plannedMin;
      weekCompletedMinutes += completedMin;
      weekMissedTasks += missedCount;

      weekDays.push({
        dayName: dayNames[i],
        date: dStr,
        plannedHours: Number((plannedMin / 60).toFixed(1)),
        completedHours: Number((completedMin / 60).toFixed(1)),
        percentage: plannedMin > 0 ? Math.round((completedMin / plannedMin) * 100) : 0,
        isToday: dStr === todayDate
      });
    }

    const weeklyTargetHours = Number((weekPlannedMinutes / 60).toFixed(1)) || (dailyStudyHours * 7);
    const weeklyCompletedHours = Number((weekCompletedMinutes / 60).toFixed(1));
    const weeklyPercentage = weeklyTargetHours > 0 
      ? Math.min(100, Math.round((weeklyCompletedHours / weeklyTargetHours) * 100))
      : 0;

    // 4. Days remaining until targetExamDate
    let daysRemaining = 0;
    if (user.targetExamDate) {
      const target = parseDate(user.targetExamDate);
      daysRemaining = Math.max(0, Math.ceil((target - today) / (1000 * 60 * 60 * 24)));
    }

    // 5. Streaks
    const streak = user.streak || { current: 0, longest: 0 };

    return {
      overall: {
        totalLectures,
        completedLectures,
        remainingLectures,
        overallPercentage,
        totalStudyHours,
        completedStudyHours,
        remainingStudyHours,
        daysRemaining,
        streak
      },
      today: todayProgress,
      weekly: {
        targetHours: weeklyTargetHours,
        completedHours: weeklyCompletedHours,
        percentage: weeklyPercentage,
        lecturesCompleted: weekLecturesCompleted,
        revisionCompletedHours: Number((weekRevisionCompletedMinutes / 60).toFixed(1)),
        practiceCompletedHours: Number((weekPracticeCompletedMinutes / 60).toFixed(1)),
        missedTasks: weekMissedTasks,
        remainingWorkloadHours: Math.max(0, Number((weeklyTargetHours - weeklyCompletedHours).toFixed(1))),
        days: weekDays
      },
      topicStats
    };
  }
}

module.exports = ProgressCalculator;
