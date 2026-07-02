const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT auth (web)
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer '))
      return res.status(401).json({ error: 'Unauthorized' });

    const token = header.split(' ')[1];

    // Try JWT first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -mobileToken');
      if (!req.user) return res.status(401).json({ error: 'User not found' });
      return next();
    } catch {
      // Fallback: mobile token (opaque random token)
      const user = await User.findOne({
        mobileToken: token,
        mobileTokenExpiry: { $gt: new Date() },
      }).select('-password');
      if (!user) return res.status(401).json({ error: 'Invalid or expired token' });
      req.user = user;
      return next();
    }
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ error: 'Admin access required' });
  next();
};

const ownerOnly = (req, res, next) => {
  if (!['owner', 'admin'].includes(req.user?.role))
    return res.status(403).json({ error: 'Owner access required' });
  next();
};

module.exports = { protect, adminOnly, ownerOnly };
