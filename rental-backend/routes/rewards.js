const express = require('express');
const router = express.Router();
const rewardsController = require('../controllers/rewardsController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticate);

// Rewards & Wallet Dashboard
router.get('/dashboard/:userId', rewardsController.getDashboard);
router.get('/transactions/:userId', rewardsController.getTransactions);
router.get('/referrals/:userId', rewardsController.getReferralsList);

// Internal/Admin trigger (protected by requireAdmin)
router.post('/trigger-payout', requireAdmin, rewardsController.triggerPayout);

module.exports = router;
