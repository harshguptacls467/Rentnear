const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/create', workflowController.createWorkflow);
router.get('/', workflowController.getWorkflows);
router.post('/:id/trigger', workflowController.triggerWorkflow);
router.get('/logs', workflowController.getWorkflowLogs);

module.exports = router;
