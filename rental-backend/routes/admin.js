const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
  getStats,
  getUsers,
  toggleBanUser,
  updateUserRole,
  getProducts,
  updateListingStatus,
  removeProduct,
  getDisputes,
  resolveDispute,
  getKycSubmissions,
  resolveKycSubmission,
  getBookings,
  updateBookingStatus,
  getPayments,
  processRefund,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  sendBulkNotification,
  getAuditLogs
} = require('../controllers/adminController');

// All routes require authentication AND admin privileges
router.use(authMiddleware, adminAuth);

// Dashboard Overview
router.get('/stats', getStats);

// Users Management
router.get('/users', getUsers);
router.patch('/users/:id/ban', toggleBanUser);
router.patch('/users/:id/role', updateUserRole);

// Products / Listings Moderation
router.get('/products', getProducts);
router.patch('/products/:id/status', updateListingStatus);
router.delete('/products/:id/remove', removeProduct);

// Bookings Moderation
router.get('/bookings', getBookings);
router.patch('/bookings/:id/status', updateBookingStatus);

// Disputes Queue
router.get('/disputes', getDisputes);
router.patch('/disputes/:id/resolve', resolveDispute);

// KYC Approvals
router.get('/kyc', getKycSubmissions);
router.patch('/kyc/:id/resolve', resolveKycSubmission);

// Payments & Refunds
router.get('/payments', getPayments);
postRefund = processRefund; // alias
router.post('/payments/refund', processRefund);

// Category Settings
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.patch('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Banner Management
router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.patch('/banners/:id', updateBanner);
router.delete('/banners/:id', deleteBanner);

// Notification Dispatch
router.post('/notifications/bulk', sendBulkNotification);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;
