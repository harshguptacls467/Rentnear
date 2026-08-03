const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/schedulingController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/slots/:productId', schedulingController.getAvailableSlots);
router.get('/booking/:bookingId', schedulingController.getSchedule);
router.post('/book', schedulingController.bookSchedule);
router.patch('/:id/status', schedulingController.updateStatus);

module.exports = router;
