const express = require('express');
const router = express.Router();
const orgController = require('../controllers/orgController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/create', orgController.createOrg);
router.get('/:id/members', orgController.getOrgMembers);
router.post('/:id/invite', orgController.inviteMember);
router.post('/invites/accept', orgController.acceptInvitation);
router.post('/:id/inventory/bulk-upload', orgController.bulkUploadInventory);
router.get('/:id/billing/invoices', orgController.getOrgBilling);

module.exports = router;
