const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);
router.post('/reset', settingsController.resetToDefaults);

module.exports = router;
