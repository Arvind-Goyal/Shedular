const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Topic = require('../models/Topic');
const StudyTask = require('../models/StudyTask');
const SchedulerEngine = require('../services/scheduler/schedulerEngine');
const { formatDate } = require('../services/scheduler/workloadCalculator');

const INITIAL_SYLLABUS = [
  { name: 'Geometry', totalLectures: 24, difficulty: 'Difficult', priorityOrder: 1 },
  { name: 'Trigonometry', totalLectures: 12, difficulty: 'Difficult', priorityOrder: 2 },
  { name: 'Data Interpretation', totalLectures: 3, difficulty: 'Easy', priorityOrder: 3 },
  { name: 'Mensuration 2D', totalLectures: 13, difficulty: 'Medium', priorityOrder: 4 },
  { name: 'Statistics', totalLectures: 3, difficulty: 'Easy', priorityOrder: 5 },
  { name: 'Percentage', totalLectures: 14, difficulty: 'Medium', priorityOrder: 6 },
  { name: 'Compound & Simple Interest', totalLectures: 12, difficulty: 'Medium', priorityOrder: 7 },
  { name: 'Profit & Loss + Discount', totalLectures: 12, difficulty: 'Medium', priorityOrder: 8 },
  { name: 'Average', totalLectures: 6, difficulty: 'Easy', priorityOrder: 9 }
];

async function seedInitialData() {
  try {
    const existingUser = await User.findOne({ email: 'aspirant@sscchsl.gov.in' });
    let user = existingUser;

    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-09-28`; // Starts 28 September!
    const targetExamDate = `${currentYear + 1}-05-31`;

    if (!user) {
      console.log('[Seed]: Creating initial Aspirant user...');
      const hashedPassword = await bcrypt.hash('ssc2026', 10);
      user = await User.create({
        name: 'CHSL Aspirant',
        email: 'aspirant@sscchsl.gov.in',
        password: hashedPassword,
        dailyStudyHours: 3.5,
        lectureDuration: 1.5,
        weeklyRevisionDays: 2,
        startDate: startDate,
        targetExamDate: targetExamDate,
        blackoutPeriods: [
          {
            startDate: `${currentYear}-10-04`,
            endDate: `${currentYear}-10-27`,
            reason: 'End Sem Exam (No Study)'
          }
        ],
        streak: {
          current: 0,
          longest: 0,
          lastActiveDate: null
        }
      });
    } else {
      // Ensure user has correct 28 September start and blackout
      user.startDate = startDate;
      user.blackoutPeriods = [
        {
          startDate: `${currentYear}-10-04`,
          endDate: `${currentYear}-10-27`,
          reason: 'End Sem Exam (No Study)'
        }
      ];
      await user.save();
    }

    // Check if topics exist for this user
    let topics = await Topic.find({ userId: user._id }).sort({ priorityOrder: 1 });
    if (topics.length === 0) {
      console.log('[Seed]: Populating initial 99 Mathematics lectures across 9 topics...');
      const topicDocs = INITIAL_SYLLABUS.map(t => ({
        userId: user._id,
        name: t.name,
        totalLectures: t.totalLectures,
        completedLectures: 0,
        difficulty: t.difficulty,
        priorityOrder: t.priorityOrder
      }));
      topics = await Topic.insertMany(topicDocs);
    }

    // Deduplicate any existing tasks (e.g. if concurrent seed requests previously inserted duplicates)
    const allUserTasks = await StudyTask.find({ userId: user._id });
    if (allUserTasks.length > 0) {
      const seenMap = new Set();
      const duplicateIds = [];

      for (const t of allUserTasks) {
        const key = `${t.date}_${t.type}_${t.lectureNumber || t.title}_${t.topicName}`;
        if (seenMap.has(key)) {
          duplicateIds.push(t._id);
        } else {
          seenMap.add(key);
        }
      }

      if (duplicateIds.length > 0) {
        console.log(`[Seed]: Removing ${duplicateIds.length} duplicate tasks...`);
        await StudyTask.deleteMany({ _id: { $in: duplicateIds } });
      }
    }

    // Check if tasks exist
    const taskCount = await StudyTask.countDocuments({ userId: user._id });
    if (taskCount === 0) {
      console.log('[Seed]: Generating dynamic schedule engine tasks...');
      const generated = SchedulerEngine.generateSchedule({
        userSettings: {
          startDate: user.startDate,
          targetExamDate: user.targetExamDate,
          dailyStudyHours: user.dailyStudyHours,
          lectureDuration: user.lectureDuration,
          weeklyRevisionDays: user.weeklyRevisionDays,
          blackoutPeriods: user.blackoutPeriods
        },
        topics: topics
      });

      const tasksToInsert = [];
      for (const day of generated.scheduleDays) {
        for (const t of day.tasks) {
          tasksToInsert.push({
            userId: user._id,
            date: t.date,
            topicId: t.topicId,
            topicName: t.topicName || 'Mathematics',
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
        console.log(`[Seed]: Inserted ${tasksToInsert.length} scheduled study tasks.`);
      }
    }

    console.log('[Seed]: Database initialized and verified successfully.');
    return user;
  } catch (error) {
    console.error('[Seed Error]:', error);
  }
}

// Mutex to ensure seed only executes once across concurrent requests
let seedPromise = null;
function seedInitialDataOnce() {
  if (!seedPromise) {
    seedPromise = seedInitialData().catch(err => {
      seedPromise = null;
      throw err;
    });
  }
  return seedPromise;
}

module.exports = {
  INITIAL_SYLLABUS,
  seedInitialData: seedInitialDataOnce
};
