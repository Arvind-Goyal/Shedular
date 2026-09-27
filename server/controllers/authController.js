const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Topic = require('../models/Topic');
const { INITIAL_SYLLABUS } = require('../seed/initialSeed');
const SchedulerEngine = require('../services/scheduler/schedulerEngine');
const StudyTask = require('../models/StudyTask');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'ssc_chsl_super_secret_planner_jwt_key_2026', {
    expiresIn: '30d'
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, dailyStudyHours, lectureDuration, weeklyRevisionDays, startDate, targetExamDate } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({
      name: name || 'SSC Aspirant',
      email,
      password: hashedPassword,
      dailyStudyHours: dailyStudyHours || 3.5,
      lectureDuration: lectureDuration || 1.5,
      weeklyRevisionDays: weeklyRevisionDays !== undefined ? weeklyRevisionDays : 2,
      startDate: startDate || '2026-10-28',
      targetExamDate: targetExamDate || '2027-05-31'
    });

    // Populate initial syllabus topics
    const topicDocs = INITIAL_SYLLABUS.map(t => ({
      userId: user._id,
      name: t.name,
      totalLectures: t.totalLectures,
      completedLectures: 0,
      difficulty: t.difficulty,
      priorityOrder: t.priorityOrder
    }));
    const createdTopics = await Topic.insertMany(topicDocs);

    // Generate schedule
    const generated = SchedulerEngine.generateSchedule({
      userSettings: {
        startDate: user.startDate,
        targetExamDate: user.targetExamDate,
        dailyStudyHours: user.dailyStudyHours,
        lectureDuration: user.lectureDuration,
        weeklyRevisionDays: user.weeklyRevisionDays
      },
      topics: createdTopics
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
    await StudyTask.insertMany(tasksToInsert);

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dailyStudyHours: user.dailyStudyHours,
        lectureDuration: user.lectureDuration,
        weeklyRevisionDays: user.weeklyRevisionDays,
        startDate: user.startDate,
        targetExamDate: user.targetExamDate,
        streak: user.streak
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dailyStudyHours: user.dailyStudyHours,
        lectureDuration: user.lectureDuration,
        weeklyRevisionDays: user.weeklyRevisionDays,
        startDate: user.startDate,
        targetExamDate: user.targetExamDate,
        streak: user.streak
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = req.user;
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dailyStudyHours: user.dailyStudyHours,
        lectureDuration: user.lectureDuration,
        weeklyRevisionDays: user.weeklyRevisionDays,
        startDate: user.startDate,
        targetExamDate: user.targetExamDate,
        streak: user.streak,
        blackoutPeriods: user.blackoutPeriods
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve profile', error: error.message });
  }
};

exports.getDemo = async (req, res) => {
  try {
    let user = await User.findOne({ email: 'aspirant@sscchsl.gov.in' });
    if (!user) {
      user = await User.findOne();
    }
    if (!user) {
      return res.status(404).json({ message: 'No demo user available' });
    }
    const token = generateToken(user._id);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        dailyStudyHours: user.dailyStudyHours,
        lectureDuration: user.lectureDuration,
        weeklyRevisionDays: user.weeklyRevisionDays,
        startDate: user.startDate,
        targetExamDate: user.targetExamDate,
        streak: user.streak,
        blackoutPeriods: user.blackoutPeriods
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Demo login failed', error: error.message });
  }
};
