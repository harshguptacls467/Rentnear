const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');
const auth = require('../middleware/auth');

// All KYC routes are protected and require a valid auth token
router.post('/aadhaar/generate-otp', auth, kycController.generateAadharOtp);
router.post('/aadhaar/verify-otp', auth, kycController.verifyAadharOtp);
router.post('/email/generate-otp', auth, kycController.generateEmailOtp);
router.post('/email/verify-otp', auth, kycController.verifyEmailOtp);

module.exports = router;
