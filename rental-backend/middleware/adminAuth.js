const supabase = require('../config/supabase');

const adminAuth = async (req, res, next) => {
  try {
    // We assume the standard authMiddleware has already run and populated req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized. User not authenticated.' });
    }


    // Double-layer security check:
    // 1. Verify that the authenticated email matches the predefined single admin email environment variable
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
    const userEmail = (req.user.email || '').toLowerCase().trim();

    if (!adminEmail || userEmail !== adminEmail) {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }

    // 2. Verify that the database user profile record has the is_admin flag set to true
    const { data: userRecord, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', req.user.id)
      .single();

    if (error || !userRecord) {
      return res.status(500).json({ message: 'Failed to verify admin status.' });
    }

    if (userRecord.is_admin !== true) {
      return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }

    // User is verified as an admin, proceed to the next handler
    return next();
  } catch (error) {
    console.error('Admin Auth Middleware Error:', error);
    return res.status(500).json({ message: 'Internal server error during admin authorization.' });
  }
};

module.exports = adminAuth;
