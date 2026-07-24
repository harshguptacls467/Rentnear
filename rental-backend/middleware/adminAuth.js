const supabase = require('../config/supabase');

const adminAuth = async (req, res, next) => {
  try {
    // We assume the standard authMiddleware has already run and populated req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized. User not authenticated.' });
    }

    // Fast-track mock/local testing sessions that are pre-verified
    if (req.user.is_admin === true) {
      return next();
    }

    // Query the users table to check if the user is an admin
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
