const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/demo', authController.getDemo);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
