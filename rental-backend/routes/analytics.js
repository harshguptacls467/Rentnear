const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authMiddleware');

// Public route to log click and conversion events (available to guest sessions)
router.post('/search/event', analyticsController.logSearchEvent);

// Protected routes (require valid JWT session token)
router.use(authenticate);

router.get('/owner/dashboard', analyticsController.getOwnerDashboard);
router.get('/owner/notifications', analyticsController.getOwnerNotifications);
router.post('/owner/notifications/:id/read', analyticsController.markNotificationRead);
router.get('/owner/reports/download', analyticsController.generateFinancialReport);
router.get('/search/report', analyticsController.getSearchAnalyticsReport);

module.exports = router;
