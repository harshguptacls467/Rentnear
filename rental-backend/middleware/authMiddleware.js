const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * authenticate — Supabase JWT Verification Middleware
 *
 * Extracts the Bearer token from the Authorization header and verifies it
 * server-side using Supabase's auth.getUser(). This cryptographically validates
 * the JWT signature against Supabase's secret — it cannot be spoofed by the client.
 *
 * On success  → sets req.user to the verified Supabase auth user and calls next().
 * On failure  → responds with 401 Unauthorized immediately.
 *
 * Usage: router.post('/protected', authenticate, controller.handler)
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. Please log in.',
          status: 401,
        },
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication token is missing.',
          status: 401,
        },
      });
    }

    // Cryptographically verify the JWT via Supabase — this is a server-side check.
    // auth.getUser(token) validates the signature using Supabase's secret key.
    // It cannot be faked by the client.
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      logger.warn(`[Auth] Invalid or expired token. Path: ${req.path} | Error: ${error?.message || 'No user returned'}`);
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired session. Please log in again.',
          status: 401,
        },
      });
    }

    // Attach the cryptographically verified user to the request object.
    // All downstream controllers can safely trust req.user.id.
    req.user = data.user;
    next();
  } catch (err) {
    logger.error(`[Auth] Middleware exception: ${err.message}`, err);
    next(err);
  }
};

const { requireAdmin } = require('./adminMiddleware');

module.exports = { authenticate, requireAdmin };
