const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, rules } = require('../middleware/validate');

router.use(authenticate);

router.get('/my', referralController.getMyReferrals);
router.post(
  '/claim',
  validate({
    body: {
      referral_code: [rules.required('referral_code'), rules.nonEmptyString('referral_code')]
    }
  }),
  referralController.claimReferralCode
);

module.exports = router;
