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
const errorHandler = require('./middleware/errorHandler');

const app = express();

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

// ── 6. Routes ─────────────────────────────────────────────────────────────────
app.use('/api', healthRoutes);
app.use('/api/products', productRoutes);
app.use('/api/bookings', strictLimiter, bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/kyc', kycRoutes);

// 404 handler for undefined routes
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Global Error Handler Middleware
app.use(errorHandler);

module.exports = app;

