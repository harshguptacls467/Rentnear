const express = require('express');
const router = express.Router();

// GET /api/health — used by Render as health check URL too
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    node_version: process.version,
    env: process.env.NODE_ENV,
    frontend_url: process.env.FRONTEND_URL || 'NOT SET',
    supabase_url: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
    supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING',
    razorpay: process.env.RAZORPAY_KEY_ID ? 'SET' : 'NOT SET',
    onesignal: process.env.ONESIGNAL_REST_API_KEY ? 'SET' : 'NOT SET',
    request_origin: req.headers.origin || 'none',
  });
});

module.exports = router;
