const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

// Public tenant resolution route
router.get('/resolve', tenantController.resolveTenant);

// Protected Super Admin routes
router.post('/create', authenticate, requireAdmin, tenantController.createTenant);
router.get('/list', authenticate, requireAdmin, tenantController.getTenants);

module.exports = router;
