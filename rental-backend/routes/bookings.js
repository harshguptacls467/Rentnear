const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const paymentController = require('../controllers/paymentController');

// Create a new booking request
router.post('/', bookingController.createBooking);

// Get all bookings for the logged-in user (as renter or owner)
router.get('/my', bookingController.getMyBookings);

// Get a specific booking by ID
router.get('/:id', bookingController.getBookingById);

// Update booking status (approve, reject, cancel, complete)
router.patch('/:id/status', bookingController.updateBookingStatus);

// Handover OTP System
router.post('/:id/generate-otp', bookingController.generateHandoverOtp);
router.post('/:id/verify-otp', bookingController.verifyHandoverOtp);

// Condition Check & Return Flow
router.post('/:id/condition-check', bookingController.submitConditionCheck);
router.post('/:id/return-check', bookingController.submitReturnCheck);
router.get('/:id/condition-compare', bookingController.getConditionComparison);
router.patch('/:id/process-return', bookingController.processReturnDecision);

// Payment & Security Deposit Routes
router.post('/:id/pay', paymentController.createRazorpayOrder);
router.post('/:id/verify-payment', paymentController.verifyRazorpayPayment);
router.post('/:id/refund-deposit', paymentController.refundDeposit);
router.post('/:id/stripe-session', paymentController.createStripeCheckoutSession);
router.post('/:id/pay-retry', paymentController.recordPaymentRetry);

module.exports = router;
