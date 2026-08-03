const express = require('express');
const router = express.Router();
const federationController = require('../controllers/federationController');
const { authenticate, requireAdmin } = require('../middleware/authMiddleware');

// Public cross-tenant search
router.get('/search', federationController.federatedSearch);

// Protected Super Admin split payouts
router.get('/settlements', authenticate, requireAdmin, federationController.getFederationSettlements);
router.post('/settlements/reconcile', authenticate, requireAdmin, federationController.reconcileWalletSettlement);

module.exports = router;
