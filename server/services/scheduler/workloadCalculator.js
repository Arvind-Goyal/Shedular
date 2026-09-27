/**
 * WorkloadCalculator
 * Calculates available study days, revision days, remaining lecture hours,
 * daily required capacity, and feasibility analysis.
 */

// Helper to format Date to YYYY-MM-DD
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to parse YYYY-MM-DD to Date in local time
function parseDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Helper to check if a date falls inside any blackout period
function isDateBlackedOut(dateStr, blackoutPeriods = []) {
  for (const period of blackoutPeriods) {
    if (dateStr >= period.startDate && dateStr <= period.endDate) {
      return { isBlackout: true, reason: period.reason || 'Exam Period / Break' };
    }
  }
  return { isBlackout: false, reason: null };
}

/**
 * Calculates workload metrics and feasibility
 * @param {Object} params
 * @param {string} params.startDate - YYYY-MM-DD
 * @param {string} params.targetExamDate - YYYY-MM-DD
 * @param {number} params.dailyStudyHours - e.g. 3.5
 * @param {number} params.lectureDuration - e.g. 1.5
 * @param {number} params.weeklyRevisionDays - e.g. 2
 * @param {Array} params.topics - Array of topic objects
 * @param {Array} params.blackoutPeriods - Array of {startDate, endDate, reason}
 */
function calculateWorkload({
  startDate,
  targetExamDate,
  dailyStudyHours = 3.5,
  lectureDuration = 1.5,
  weeklyRevisionDays = 2,
  topics = [],
  blackoutPeriods = []
}) {
  const start = parseDate(startDate);
  const target = parseDate(targetExamDate);

  if (target <= start) {
    return {
      isFeasible: false,
      error: 'Target exam date must be after start date.',
      availableStudyDays: 0,
      revisionDays: 0,
      lectureStudyDays: 0,
      totalRemainingLectures: 0,
      totalRemainingLectureHours: 0,
      requiredDailyLectureHours: 0,
      bufferDays: 0,
      feasibilityMessage: 'Target exam date must be in the future.'
    };
  }

  // Calculate total and remaining lectures
  let totalLectures = 0;
  let completedLectures = 0;
  for (const t of topics) {
    totalLectures += (t.totalLectures || 0);
    completedLectures += (t.completedLectures || 0);
  }
  const totalRemainingLectures = Math.max(0, totalLectures - completedLectures);
  const totalRemainingLectureHours = totalRemainingLectures * lectureDuration;

  // Max lectures per day based on study hours and lecture duration
  // E.g. 3.5h / 1.5h = 2 lectures (3.0h) + 0.5h practice
  const maxLecturesPerDay = Math.max(1, Math.floor(dailyStudyHours / lectureDuration));
  const dailyPracticeMinutes = 0; // Practice is handled solely on revision days as requested

  // Build calendar timeline
  const allDays = [];
  let curr = new Date(start);
  while (curr <= target) {
    const dateStr = formatDate(curr);
    const dayOfWeek = curr.getDay(); // 0 is Sunday, 4 is Thursday, etc.
    const blackout = isDateBlackedOut(dateStr, blackoutPeriods);

    allDays.push({
      dateStr,
      dayOfWeek,
      isBlackout: blackout.isBlackout,
      blackoutReason: blackout.reason
    });

    curr.setDate(curr.getDate() + 1);
  }

  const calendarDays = allDays.length;
  const activeDays = allDays.filter(d => !d.isBlackout);

  // Determine revision days:
  // Default weeklyRevisionDays is 2 (e.g. Thursday = 4, Sunday = 0)
  // If weeklyRevisionDays == 1: Sunday (0)
  // If weeklyRevisionDays == 2: Thursday (4) & Sunday (0)
  // If weeklyRevisionDays == 3: Tuesday (2), Thursday (4) & Sunday (0)
  // If weeklyRevisionDays == 4: Mon, Wed, Fri, Sun
  const getRevisionDaysSet = (count) => {
    switch (count) {
      case 1: return new Set([0]); // Sunday
      case 2: return new Set([0, 4]); // Sunday, Thursday
      case 3: return new Set([0, 2, 4]); // Sun, Tue, Thu
      case 4: return new Set([0, 2, 4, 6]);
      default: return new Set();
    }
  };

  const revisionDayOfWeekSet = getRevisionDaysSet(weeklyRevisionDays);

  let revisionDaysCount = 0;
  let lectureDaysCount = 0;

  for (const day of activeDays) {
    if (revisionDayOfWeekSet.has(day.dayOfWeek)) {
      day.isRevision = true;
      revisionDaysCount++;
    } else {
      day.isRevision = false;
      lectureDaysCount++;
    }
  }

  // Lectures needed per lecture day
  const requiredLecturesPerDay = lectureDaysCount > 0
    ? totalRemainingLectures / lectureDaysCount
    : totalRemainingLectures;

  const requiredDailyLectureHours = lectureDaysCount > 0
    ? (totalRemainingLectureHours / lectureDaysCount)
    : totalRemainingLectureHours;

  // Needed lecture days to finish at maxLecturesPerDay
  const neededLectureDays = Math.ceil(totalRemainingLectures / maxLecturesPerDay);
  const bufferDays = Math.max(0, lectureDaysCount - neededLectureDays);

  // Minimum daily hours required to finish on time given current lectureDaysCount
  const minRequiredDailyStudyHours = lectureDaysCount > 0
    ? Number(((totalRemainingLectureHours / lectureDaysCount) + (dailyPracticeMinutes / 60)).toFixed(2))
    : 999;

  // Feasibility Check
  // If required lectures per day exceeds maxLecturesPerDay, it's not feasible within user's study hours
  const isFeasible = requiredLecturesPerDay <= maxLecturesPerDay && lectureDaysCount >= neededLectureDays;

  // Actionable suggestions if infeasible
  let feasibilityMessage = null;
  let suggestions = null;

  if (!isFeasible) {
    const diffHours = (minRequiredDailyStudyHours - dailyStudyHours).toFixed(1);
    feasibilityMessage = `Current schedule is not feasible. You need approximately ${minRequiredDailyStudyHours} study hours/day to finish by your target date, but your limit is ${dailyStudyHours} hours/day. Increase daily study hours, reduce revision days, or extend the target date.`;

    // Calculate how many extra days needed at current study hours
    const daysShortfall = neededLectureDays - lectureDaysCount;
    // approximate calendar days extension needed
    const calendarDaysExtension = Math.ceil(daysShortfall * (7 / Math.max(1, 7 - weeklyRevisionDays)));
    const suggestedTargetDate = new Date(target);
    suggestedTargetDate.setDate(suggestedTargetDate.getDate() + calendarDaysExtension);

    suggestions = {
      requiredStudyHours: Math.min(12, Number((minRequiredDailyStudyHours + 0.1).toFixed(1))),
      suggestedWeeklyRevisionDays: Math.max(0, weeklyRevisionDays - 1),
      suggestedTargetExamDate: formatDate(suggestedTargetDate),
      calendarDaysExtension
    };
  }

  return {
    isFeasible,
    feasibilityMessage,
    suggestions,
    calendarDays,
    availableStudyDays: activeDays.length,
    revisionDays: revisionDaysCount,
    lectureStudyDays: lectureDaysCount,
    totalLectures,
    completedLectures,
    totalRemainingLectures,
    totalRemainingLectureHours,
    maxLecturesPerDay,
    dailyPracticeMinutes,
    requiredLecturesPerDay: Number(requiredLecturesPerDay.toFixed(2)),
    requiredDailyLectureHours: Number(requiredDailyLectureHours.toFixed(2)),
    minRequiredDailyStudyHours,
    neededLectureDays,
    bufferDays,
    allDays
  };
}

module.exports = {
  calculateWorkload,
  formatDate,
  parseDate,
  isDateBlackedOut
};
