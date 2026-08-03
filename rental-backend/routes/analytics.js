const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/owner/dashboard', analyticsController.getOwnerDashboard);

module.exports = router;
