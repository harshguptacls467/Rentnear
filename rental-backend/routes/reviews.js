const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.post('/', reviewController.submitReview);
router.get('/user/:userId', reviewController.getUserReviews);

module.exports = router;
