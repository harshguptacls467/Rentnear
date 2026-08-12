const express = require('express');
const router = express.Router();

// GET /api/health — used by Render as health check URL too.
// SECURITY: Only expose SET/MISSING indicators, never raw env values.
// Do NOT add new fields that reveal internal config here.
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    services: {
      supabase_url:       process.env.SUPABASE_URL                ? 'SET' : 'MISSING',
      supabase_key:       (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'SET' : 'MISSING',
      frontend_url:       process.env.FRONTEND_URL                ? 'SET' : 'MISSING',
      razorpay:           process.env.RAZORPAY_KEY_ID             ? 'SET' : 'MISSING',
      onesignal:          process.env.ONESIGNAL_REST_API_KEY      ? 'SET' : 'MISSING',
    },
  });
});

module.exports = router;
