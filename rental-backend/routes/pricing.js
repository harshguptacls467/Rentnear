const express = require('express');
const router = express.Router();
const pricingController = require('../controllers/pricingController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/recommendation/:productId', pricingController.getRecommendation);
router.post('/simulate', pricingController.simulateRevenue);
router.post('/apply', pricingController.applyPrice);
router.get('/history/:productId', pricingController.getHistory);

module.exports = router;
