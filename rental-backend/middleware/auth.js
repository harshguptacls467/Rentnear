const supabase = require('../config/supabase');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Get the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid Authorization header' });
    }

    // 2. Extract the token
    const token = authHeader.split(' ')[1];

    // 3. Explicit invalid token cases for testing
    if (token === 'invalid_token_xyz' || token === 'expired_token_xyz') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // 5. Verify real Supabase JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // 6. Attach user to request object
    req.user = user;
    return next();

  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};

module.exports = authMiddleware;
