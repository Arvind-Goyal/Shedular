const { calculateWorkload, formatDate, parseDate } = require('./workloadCalculator');
const { planRevisionDay } = require('./revisionPlanner');

/**
 * SchedulerEngine
 * Generates the complete, realistic daily Mathematics study schedule.
 * Intelligently combines lectures, revision, and practice to fit dailyStudyHours.
 */
class SchedulerEngine {
  /**
   * Generates a full schedule
   * @param {Object} params
   * @param {Object} params.userSettings
   * @param {Array} params.topics
   * @param {Array} params.existingCompletedTasks - Tasks already completed to preserve
   */
  static generateSchedule({ userSettings, topics = [], existingCompletedTasks = [] }) {
    const {
      startDate,
      targetExamDate,
      dailyStudyHours = 3.5,
      lectureDuration = 1.5,
      weeklyRevisionDays = 2,
      blackoutPeriods = []
    } = userSettings;

    // 1. Calculate workload and feasibility
    const workload = calculateWorkload({
      startDate,
      targetExamDate,
      dailyStudyHours,
      lectureDuration,
      weeklyRevisionDays,
      topics,
      blackoutPeriods
    });

    const lectureDurationMinutes = Math.round(lectureDuration * 60);
    const targetDailyMinutes = Math.round(dailyStudyHours * 60);
    const maxLecturesPerDay = workload.maxLecturesPerDay;
    const dailyPracticeMinutes = workload.dailyPracticeMinutes;

    // Convert topics to clean plain JS objects
    const cleanTopics = topics.map(t => {
      const obj = t.toObject ? t.toObject() : t;
      return {
        _id: obj._id,
        name: obj.name || 'Mathematics',
        totalLectures: Number(obj.totalLectures) || 0,
        completedLectures: Number(obj.completedLectures) || 0,
        difficulty: obj.difficulty || 'Medium',
        priorityOrder: Number(obj.priorityOrder) || 1
      };
    });

    // 2. Prepare queue of pending lectures across all topics
    const lectureQueue = [];
    const sortedTopics = [...cleanTopics].sort((a, b) => (a.priorityOrder || 0) - (b.priorityOrder || 0));

    for (const topic of sortedTopics) {
      const completed = topic.completedLectures || 0;
      const total = topic.totalLectures || 0;
      for (let lec = completed + 1; lec <= total; lec++) {
        lectureQueue.push({
          topicId: topic._id,
          topicName: topic.name,
          lectureNumber: lec,
          durationMinutes: lectureDurationMinutes,
          difficulty: topic.difficulty || 'Medium'
        });
      }
    }

    // Map existing completed tasks by date for fast lookup
    const completedTasksByDate = new Map();
    for (const task of existingCompletedTasks) {
      if (!completedTasksByDate.has(task.date)) {
        completedTasksByDate.set(task.date, []);
      }
      completedTasksByDate.get(task.date).push(task);
    }

    // 3. Distribute across available days
    const scheduleDays = [];
    let queueIndex = 0;
    const activeTopicsSeen = new Set(
      cleanTopics.filter(t => (t.completedLectures || 0) > 0).map(t => t._id ? t._id.toString() : t.name)
    );

    for (const day of workload.allDays) {
      const dateStr = day.dateStr;

      // Check if this date already has completed tasks
      const pastCompleted = completedTasksByDate.get(dateStr) || [];

      if (day.isBlackout) {
        scheduleDays.push({
          date: dateStr,
          dayOfWeek: day.dayOfWeek,
          isBlackout: true,
          blackoutReason: day.blackoutReason,
          isRevision: false,
          plannedMinutes: 0,
          status: 'rest',
          tasks: pastCompleted
        });
        continue;
      }

      if (day.isRevision) {
        // Plan revision tasks
        const revisionTasks = planRevisionDay({
          date: dateStr,
          dailyStudyHours,
          topics: cleanTopics,
          inProgressTopics: Array.from(activeTopicsSeen)
        });

        const dayTasks = [...pastCompleted];
        let plannedMinutes = 0;

        const revisionSlots = [
          { slotName: 'Morning Revision', startTime: '09:00 AM', endTime: '10:30 AM', timeSlot: '09:00 AM – 10:30 AM' },
          { slotName: 'Midday PYQs', startTime: '11:00 AM', endTime: '12:30 PM', timeSlot: '11:00 AM – 12:30 PM' },
          { slotName: 'Evening Drill', startTime: '05:00 PM', endTime: '05:40 PM', timeSlot: '05:00 PM – 05:40 PM' },
          { slotName: 'Night Review', startTime: '06:00 PM', endTime: '06:40 PM', timeSlot: '06:00 PM – 06:40 PM' }
        ];

        let rIdx = 0;
        for (const rTask of revisionTasks) {
          const slot = revisionSlots[rIdx] || { slotName: 'Revision Slot', startTime: '09:00 AM', endTime: '10:30 AM', timeSlot: '09:00 AM – 10:30 AM' };
          dayTasks.push({
            date: dateStr,
            topicId: rTask.topicId,
            topicName: rTask.topicName || 'Mathematics',
            type: rTask.type,
            title: rTask.title,
            durationMinutes: rTask.durationMinutes,
            startTime: slot.startTime,
            endTime: slot.endTime,
            timeSlot: slot.timeSlot,
            slotName: slot.slotName,
            completed: false,
            isManual: false
          });
          plannedMinutes += rTask.durationMinutes;
          rIdx++;
        }

        scheduleDays.push({
          date: dateStr,
          dayOfWeek: day.dayOfWeek,
          isBlackout: false,
          isRevision: true,
          plannedMinutes,
          status: pastCompleted.length > 0 ? 'completed' : 'future',
          tasks: dayTasks
        });
        continue;
      }

      // Lecture study day
      const dayTasks = [...pastCompleted];
      let dayLectureMinutes = 0;
      let lecturesAssigned = 0;
      let lastTopicName = null;
      let lastTopicId = null;

      // If all lectures are already completed, schedule Full Mock / Revision
      if (queueIndex >= lectureQueue.length && lectureQueue.length > 0) {
        dayTasks.push({
          date: dateStr,
          topicId: null,
          topicName: 'Full Syllabus',
          type: 'mock_test',
          title: 'SSC CHSL Full Maths Mock Test & Performance Analysis',
          durationMinutes: targetDailyMinutes,
          completed: false,
          isManual: false
        });

        scheduleDays.push({
          date: dateStr,
          dayOfWeek: day.dayOfWeek,
          isBlackout: false,
          isRevision: false,
          plannedMinutes: targetDailyMinutes,
          status: pastCompleted.length > 0 ? 'completed' : 'future',
          tasks: dayTasks
        });
        continue;
      }

      const lectureSlots = [
        { slotName: 'Morning Slot', startTime: '09:00 AM', endTime: '10:30 AM', timeSlot: '09:00 AM – 10:30 AM' },
        { slotName: 'Evening Slot', startTime: '05:00 PM', endTime: '06:30 PM', timeSlot: '05:00 PM – 06:30 PM' },
        { slotName: 'Night Slot', startTime: '08:00 PM', endTime: '09:30 PM', timeSlot: '08:00 PM – 09:30 PM' }
      ];

      // Assign up to maxLecturesPerDay from the queue
      while (queueIndex < lectureQueue.length && lecturesAssigned < maxLecturesPerDay) {
        const lecture = lectureQueue[queueIndex];
        const slot = lectureSlots[lecturesAssigned] || lectureSlots[0];
        dayTasks.push({
          date: dateStr,
          topicId: lecture.topicId,
          topicName: lecture.topicName || 'Mathematics',
          type: 'lecture',
          lectureNumber: lecture.lectureNumber,
          title: `${lecture.topicName} — Lecture ${lecture.lectureNumber}`,
          durationMinutes: lecture.durationMinutes,
          startTime: slot.startTime,
          endTime: slot.endTime,
          timeSlot: slot.timeSlot,
          slotName: slot.slotName,
          completed: false,
          isManual: false
        });

        dayLectureMinutes += lecture.durationMinutes;
        lecturesAssigned++;
        lastTopicName = lecture.topicName;
        lastTopicId = lecture.topicId;
        activeTopicsSeen.add(lecture.topicId ? lecture.topicId.toString() : lecture.topicName);
        queueIndex++;
      }

      // On lecture days, only lectures are scheduled (revision is handled on dedicated revision days)
      const totalDayPlannedMinutes = dayTasks.reduce((sum, t) => sum + (t.durationMinutes || 0), 0);

      scheduleDays.push({
        date: dateStr,
        dayOfWeek: day.dayOfWeek,
        isBlackout: false,
        isRevision: false,
        plannedMinutes: totalDayPlannedMinutes,
        status: pastCompleted.length > 0 ? 'completed' : 'future',
        tasks: dayTasks
      });
    }

    // Determine estimated completion date
    let estimatedCompletionDate = null;
    if (queueIndex >= lectureQueue.length && lectureQueue.length > 0) {
      // Find the last day where a lecture was scheduled
      for (let i = scheduleDays.length - 1; i >= 0; i--) {
        const hasLecture = scheduleDays[i].tasks.some(t => t.type === 'lecture' && !t.completed);
        if (hasLecture) {
          estimatedCompletionDate = scheduleDays[i].date;
          break;
        }
      }
    }

    return {
      workload,
      isFeasible: workload.isFeasible,
      feasibilityMessage: workload.feasibilityMessage,
      suggestions: workload.suggestions,
      totalScheduledLectures: queueIndex,
      unscheduledLecturesCount: Math.max(0, lectureQueue.length - queueIndex),
      estimatedCompletionDate,
      scheduleDays
    };
  }
}

module.exports = SchedulerEngine;
