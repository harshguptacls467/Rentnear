const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, rules } = require('../middleware/validate');

// ── All KYC routes require a verified session ──────────────────────────────────
router.use(authenticate);

router.post(
  '/aadhaar/generate-otp',
  validate({ body: { aadharNumber: [rules.required('aadharNumber'), rules.aadhaar('aadharNumber')] } }),
  kycController.generateAadharOtp
);
router.post('/aadhaar/verify-otp', kycController.verifyAadharOtp);
router.post('/email/generate-otp', kycController.generateEmailOtp);
router.post('/email/verify-otp', kycController.verifyEmailOtp);

module.exports = router;
