const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * requireAdmin — Server-Side Admin Role Verification Middleware
 *
 * MUST be used AFTER the `authenticate` middleware (which populates req.user).
 *
 * Performs a database-level check against public.users.is_admin.
 * This cannot be spoofed by the client — it reads directly from the DB
 * using the service role key, bypassing any RLS policies.
 *
 * On success  → admin is confirmed, calls next().
 * On failure  → responds with 403 Forbidden immediately.
 *
 * Usage: router.get('/admin/stats', authenticate, requireAdmin, controller.getStats)
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      // This should never happen if authenticate() ran first, but defend anyway.
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required.',
          status: 401,
        },
      });
    }

    // Query the DB directly — this is authoritative. The service role key bypasses RLS,
    // so this cannot be manipulated by any client-side JWT payload claim.
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', req.user.id)
      .maybeSingle();

    if (error) {
      logger.error(`[AdminMiddleware] DB error checking admin status for user ${req.user.id}: ${error.message}`);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to verify admin privileges.',
          status: 500,
        },
      });
    }

    if (!data || data.is_admin !== true) {
      logger.warn(`[AdminMiddleware] Unauthorized admin access attempt by user ${req.user.id} on path ${req.path}`);
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Administrator privileges required.',
          status: 403,
        },
      });
    }

    next();
  } catch (err) {
    logger.error(`[AdminMiddleware] Middleware exception: ${err.message}`, err);
    next(err);
  }
};

module.exports = { requireAdmin };
