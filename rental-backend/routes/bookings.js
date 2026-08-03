const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, rules } = require('../middleware/validate');

// ── All booking routes require a verified session ──────────────────────────────
router.use(authenticate);

// Create a new booking request
router.post(
  '/',
  validate({
    body: {
      product_id: [rules.required('product_id'), rules.uuid('product_id')],
      start_date: [rules.required('start_date'), rules.isoDate('start_date')],
      end_date:   [rules.required('end_date'),   rules.isoDate('end_date')],
    },
  }),
  bookingController.createBooking
);

// Extend an active or approved booking
router.post(
  '/:id/extend',
  validate({
    params: {
      id: [rules.required('id'), rules.uuid('id')]
    },
    body: {
      extension_days: [rules.required('extension_days')]
    }
  }),
  bookingController.extendBooking
);

// Get all bookings for the logged-in user (as renter or owner)
router.get('/my', bookingController.getMyBookings);

// Get owner payout and earnings history
router.get('/payouts/my', paymentController.getMyPayouts);

// Get a specific booking by ID
router.get('/:id', bookingController.getBookingById);

// Update booking status (approve, reject, cancel, complete)
router.patch(
  '/:id/status',
  validate({
    body: {
      status: [
        rules.required('status'),
        rules.oneOf('status', ['pending', 'approved', 'rejected', 'active', 'completed', 'cancelled', 'disputed']),
      ],
    },
  }),
  bookingController.updateBookingStatus
);

// Handover OTP System
router.post('/:id/generate-otp', bookingController.generateHandoverOtp);
router.post(
  '/:id/verify-otp',
  validate({ body: { otp: [rules.required('otp')] } }),
  bookingController.verifyHandoverOtp
);

// Condition Check & Return Flow
router.post('/:id/condition-check', bookingController.submitConditionCheck);
router.post('/:id/return-check', bookingController.submitReturnCheck);
router.get('/:id/condition-compare', bookingController.getConditionComparison);
router.patch(
  '/:id/process-return',
  validate({
    body: { action: [rules.required('action'), rules.oneOf('action', ['release', 'dispute'])] },
  }),
  bookingController.processReturnDecision
);

// Escrow Security Deposit Damage Claim (Owner only, within 48h)
router.post(
  '/:id/claim-deposit',
  validate({
    params: {
      id: [rules.required('id'), rules.uuid('id')]
    },
    body: {
      deposit_claimed_amount: [rules.required('deposit_claimed_amount')],
      claim_reason: [rules.required('claim_reason'), rules.nonEmptyString('claim_reason')]
    }
  }),
  bookingController.claimDeposit
);

// Payment & Security Deposit Routes
router.post('/:id/pay', paymentController.createRazorpayOrder);
router.post(
  '/:id/verify-payment',
  validate({
    body: {
      razorpay_order_id:   [rules.required('razorpay_order_id'),   rules.nonEmptyString('razorpay_order_id')],
      razorpay_payment_id: [rules.required('razorpay_payment_id'), rules.nonEmptyString('razorpay_payment_id')],
      razorpay_signature:  [rules.required('razorpay_signature'),  rules.nonEmptyString('razorpay_signature')],
    },
  }),
  paymentController.verifyRazorpayPayment
);
router.post('/:id/refund-deposit', paymentController.refundDeposit);
router.post('/:id/pay-retry', paymentController.recordPaymentRetry);

// NOTE: Stripe checkout route has been removed — not yet implemented.
// It will be re-added as a proper route once the Stripe SDK integration is complete.

module.exports = router;
