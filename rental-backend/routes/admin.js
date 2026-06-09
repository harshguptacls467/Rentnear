const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getStats,
  getUsers,
  toggleBanUser,
  getProducts,
  removeProduct,
  getDisputes,
  resolveDispute,
  getKycSubmissions,
  resolveKycSubmission
} = require('../controllers/adminController');

// All routes require authentication AND admin privileges
router.use(authMiddleware, adminAuth);

// Dashboard Overview
router.get('/stats', getStats);

// Users Management
router.get('/users', getUsers);
router.patch('/users/:id/ban', toggleBanUser);

// Products / Listings Moderation
router.get('/products', getProducts);
router.delete('/products/:id/remove', removeProduct);

// Disputes Queue
router.get('/disputes', getDisputes);
router.patch('/disputes/:id/resolve', resolveDispute);

// KYC Approvals
router.get('/kyc', getKycSubmissions);
router.patch('/kyc/:id/resolve', resolveKycSubmission);

module.exports = router;
