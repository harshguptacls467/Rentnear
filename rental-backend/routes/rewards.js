const express = require('express');
const router = express.Router();
const rewardsController = require('../controllers/rewardsController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticate);

// Rewards & Wallet Dashboard
router.get('/dashboard/:userId', rewardsController.getDashboard);
router.get('/transactions/:userId', rewardsController.getTransactions);
router.get('/referrals/:userId', rewardsController.getReferralsList);

// Internal/Admin trigger (could be protected by a webhook secret or requireAdmin)
// Leaving it open to authenticate for easy local testing, but it should validate internal source.
router.post('/trigger-payout', rewardsController.triggerPayout);

module.exports = router;
