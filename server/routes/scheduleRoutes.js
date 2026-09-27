const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', scheduleController.getSchedule);
router.get('/today', scheduleController.getTodayPlan);
router.get('/calendar', scheduleController.getCalendar);
router.post('/recalculate', scheduleController.recalculateSchedule);
router.post('/optimize', scheduleController.optimizeSchedule);

module.exports = router;
