const express = require('express');
const router = express.Router();
const developerController = require('../controllers/developerController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/keys', developerController.generateKey);
router.get('/keys', developerController.getKeys);
router.delete('/keys/:id', developerController.revokeKey);

router.post('/webhooks', developerController.createWebhookEndpoint);
router.get('/webhooks', developerController.getWebhookEndpoints);
router.get('/logs', developerController.getApiLogs);

module.exports = router;
