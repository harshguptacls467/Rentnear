const express = require('express');
const router = express.Router();
const trustController = require('../controllers/trustController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticate);

// Public/Owner Profile routes
router.get('/:userId', trustController.getUserTrustInfo);
router.post('/recalculate/:userId', trustController.recalculateTrustScore);

// Admin Moderation
router.post('/admin/:userId/adjust', requireAdmin, trustController.adminAdjustScore);
router.get('/admin/fraud-alerts', requireAdmin, trustController.getFraudAlerts);

module.exports = router;
