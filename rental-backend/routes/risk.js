const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

router.use(authenticate);
router.use(requireAdmin);

router.post('/recalculate', riskController.recalculateUserRisk);
router.get('/investigations', riskController.getInvestigations);
router.post('/investigations/:id/resolve', riskController.resolveInvestigation);

module.exports = router;
