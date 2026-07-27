const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycController');

router.post('/aadhaar/generate-otp', kycController.generateAadharOtp);
router.post('/aadhaar/verify-otp', kycController.verifyAadharOtp);
router.post('/email/generate-otp', kycController.generateEmailOtp);
router.post('/email/verify-otp', kycController.verifyEmailOtp);

module.exports = router;
