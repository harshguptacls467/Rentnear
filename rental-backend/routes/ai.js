const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.post('/query', authenticate, aiController.queryAssistant);
router.get('/admin/usage', authenticate, requireAdmin, aiController.getAiAnalytics);

module.exports = router;
