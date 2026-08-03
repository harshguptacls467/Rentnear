const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');
const { validate, rules } = require('../middleware/validate');

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

// ── All admin routes require a valid session AND confirmed is_admin = true in DB ──
router.use(authenticate, requireAdmin);

// Dashboard Overview
router.get('/stats', getStats);

// Users Management
router.get('/users', getUsers);
router.patch(
  '/users/:id/ban',
  validate({ params: { id: [rules.required('id'), rules.uuid('id')] } }),
  toggleBanUser
);
router.patch(
  '/users/:id/role',
  validate({ params: { id: [rules.required('id'), rules.uuid('id')] } }),
  updateUserRole
);

// Products / Listings Moderation
router.get('/products', getProducts);
router.patch('/products/:id/status', updateListingStatus);
router.delete('/products/:id/remove', removeProduct);

// Bookings Moderation
router.get('/bookings', getBookings);
router.patch('/bookings/:id/status', updateBookingStatus);

// Disputes Queue
router.get('/disputes', getDisputes);
router.patch(
  '/disputes/:id/resolve',
  validate({
    params: { id: [rules.required('id'), rules.uuid('id')] }
  }),
  resolveDispute
);

// KYC Approvals
router.get('/kyc', getKycSubmissions);
router.patch('/kyc/:id/resolve', resolveKycSubmission);

// Payments & Refunds
router.get('/payments', getPayments);
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
router.post(
  '/notifications/bulk',
  validate({ body: { message: [rules.required('message'), rules.nonEmptyString('message')] } }),
  sendBulkNotification
);

// Audit Logs
router.get('/audit-logs', getAuditLogs);

module.exports = router;
