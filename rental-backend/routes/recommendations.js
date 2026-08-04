const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { authenticate } = require('../middleware/authMiddleware');
const supabase = require('../config/supabase');

// Optional Authentication Middleware to extract user session if provided
const optionalAuthenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const { data, error } = await supabase.auth.getUser(token);
        if (!error && data?.user) {
          req.user = data.user;
        }
      }
    }
  } catch (err) {
    // Fail silently, proceed as guest
  }
  next();
};

// GET /api/v1/recommendations/feed (Get personalized sections feed)
router.get('/feed', optionalAuthenticate, recommendationController.getPersonalizedFeed);

// POST /api/v1/recommendations/activity (Log user activity)
router.post('/activity', optionalAuthenticate, recommendationController.logUserActivity);

// GET /api/v1/recommendations/report (CTR and conversion report - admin only)
router.get('/report', authenticate, recommendationController.getRecommendationPerformance);

module.exports = router;
