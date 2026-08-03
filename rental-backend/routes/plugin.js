const express = require('express');
const router = express.Router();
const pluginController = require('../controllers/pluginController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/publish', pluginController.publishPlugin);
router.post('/install', pluginController.installPlugin);
router.post('/installations/:id/toggle', pluginController.togglePlugin);
router.put('/installations/:id/settings', pluginController.updatePluginSettings);
router.get('/marketplace', pluginController.getMarketplace);

module.exports = router;
