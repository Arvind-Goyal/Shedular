const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
router.post('/quick-log', taskController.quickLogActivity);
router.patch('/:id/toggle', taskController.toggleTaskCompletion);
router.put('/:id', taskController.updateTask);
router.patch('/:id/move', taskController.moveTask);
router.patch('/:id/skip', taskController.skipTask);
router.delete('/:id', taskController.deleteTask);

module.exports = router;
