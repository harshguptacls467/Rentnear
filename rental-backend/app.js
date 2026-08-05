require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const healthRoutes = require('./routes/health');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const productRoutes = require('./routes/products');
const reviewRoutes = require('./routes/reviews');
const kycRoutes = require('./routes/kyc');
const referralRoutes = require('./routes/referrals');
const wishlistRoutes = require('./routes/wishlist');
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const trustRoutes = require('./routes/trust');
const rewardsRoutes = require('./routes/rewards');
const pricingRoutes = require('./routes/pricing');
const schedulingRoutes = require('./routes/scheduling');
const aiRoutes = require('./routes/ai');
const orgRoutes = require('./routes/org');
const developerRoutes = require('./routes/developer');
const riskRoutes = require('./routes/risk');
const tenantRoutes = require('./routes/tenant');
const federationRoutes = require('./routes/federation');
const pluginRoutes = require('./routes/plugin');
const workflowRoutes = require('./routes/workflow');
const recommendationRoutes = require('./routes/recommendations');
const errorHandler = require('./middleware/errorHandler');
const traceMiddleware = require('./middleware/traceMiddleware');

const app = express();

// Enable structured tracing & correlation ID mapping on all incoming routes
app.use(traceMiddleware);

// Trust Render/Vercel's reverse proxy — required for accurate IP-based rate limiting
app.set('trust proxy', 1);


// ── 1. Security Headers (helmet) ─────────────────────────────────────────────
// Sets X-Content-Type-Options, X-Frame-Options, HSTS, CSP etc.
app.use(helmet());

// ── 2. CORS — Restricted to frontend origin only ─────────────────────────────
// FRONTEND_URL must be set in Render env vars (e.g. https://rentnear.vercel.app)
// Trim trailing slashes to prevent common misconfiguration
const rawFrontendUrl = (process.env.FRONTEND_URL || '').replace(/\/+$/, '');

const allowedOrigins = [
  rawFrontendUrl || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
].filter(Boolean);

// Log allowed origins on startup — visible in Render logs
console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, server-to-server, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`[CORS] Blocked origin: ${origin}`);
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── 3. Global Rate Limiter — 100 requests per 15 minutes per IP ──────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ── 4. Strict Rate Limiter — for write operations (booking, payment) ─────────
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests on this endpoint, please slow down.' },
});

// ── 5. Parse incoming JSON requests ──────────────────────────────────────────
app.use(express.json({ limit: '2mb' })); // Limit body size to 2MB

// ── 6. Routes (Versioned /api/v1 & Backward-Compatible /api Mounts) ───────────
app.use('/api', healthRoutes);
app.use('/api/v1/health', healthRoutes);

app.use(['/api/products', '/api/v1/products'], productRoutes);
app.use(['/api/bookings', '/api/v1/bookings'], strictLimiter, bookingRoutes);
app.use(['/api/admin', '/api/v1/admin'], adminRoutes);
app.use(['/api/reviews', '/api/v1/reviews'], reviewRoutes);
app.use(['/api/kyc', '/api/v1/kyc'], kycRoutes);
app.use(['/api/referrals', '/api/v1/referrals'], referralRoutes);
app.use(['/api/wishlist', '/api/v1/wishlist'], wishlistRoutes);
app.use(['/api/notifications', '/api/v1/notifications'], notificationRoutes);
app.use(['/api/analytics', '/api/v1/analytics'], analyticsRoutes);
app.use(['/api/trust', '/api/v1/trust'], trustRoutes);
app.use(['/api/rewards', '/api/v1/rewards'], rewardsRoutes);
app.use(['/api/pricing', '/api/v1/pricing'], pricingRoutes);
app.use(['/api/scheduling', '/api/v1/scheduling'], schedulingRoutes);
app.use(['/api/ai', '/api/v1/ai'], aiRoutes);
app.use(['/api/orgs', '/api/v1/orgs'], orgRoutes);
app.use(['/api/developer', '/api/v1/developer'], developerRoutes);
app.use(['/api/admin/risk', '/api/v1/admin/risk'], riskRoutes);
app.use(['/api/tenant', '/api/v1/tenant'], tenantRoutes);
app.use(['/api/federation', '/api/v1/federation'], federationRoutes);
app.use(['/api/plugins', '/api/v1/plugins'], pluginRoutes);
app.use(['/api/workflows', '/api/v1/workflows'], workflowRoutes);
app.use(['/api/recommendations', '/api/v1/recommendations'], recommendationRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;

