const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/authMiddleware');
const { validate, rules } = require('../middleware/validate');

// ── Public (profile pages can read reviews & trust badges without login) ──────
router.get('/user/:userId', reviewController.getUserReviews);
router.get('/user/:userId/trust', reviewController.getUserTrust);

// ── Authenticated (only logged-in users can submit reviews) ───────────────────
router.post(
  '/',
  authenticate,
  validate({
    body: {
      booking_id:  [rules.required('booking_id'),  rules.uuid('booking_id')],
      reviewee_id: [rules.required('reviewee_id'), rules.uuid('reviewee_id')],
      rating:      [rules.required('rating'),      rules.intRange('rating', 1, 5)],
    },
  }),
  reviewController.submitReview
);

module.exports = router;
