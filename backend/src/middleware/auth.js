const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const logger = require('./logger');

// Role hierarchy: super_admin > admin > finance/operations > agent
const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  admin: ['bookings:*', 'clients:*', 'operators:*', 'fleet:*', 'quotes:*', 'payments:*', 'documents:*', 'agent-requests:*', 'sourcing:*', 'avinode:*', 'airports:*', 'notifications:*', 'audit-log:read', 'dashboard:*'],
  finance: ['bookings:read', 'payments:*', 'documents:read', 'clients:read', 'notifications:*', 'dashboard:read'],
  operations: ['bookings:*', 'checklist:*', 'documents:*', 'fleet:read', 'operators:read', 'notifications:*', 'sourcing:*', 'dashboard:read'],
  agent: ['bookings:read', 'agent-requests:own', 'clients:read', 'airports:read', 'notifications:*', 'quotes:read'],
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwtConfig.verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-passwordHash -refreshTokens');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    req.user = user;
    req.userId = user._id.toString();
    req.userRole = user.role;
    next();
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

const authorizePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userPerms = ROLE_PERMISSIONS[req.user.role] || [];

    if (userPerms.includes('*')) return next();

    const [resource, action] = permission.split(':');
    const hasPermission =
      userPerms.includes(`${resource}:*`) ||
      userPerms.includes(permission) ||
      userPerms.includes(`${resource}:own`);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize, authorizePermission, ROLE_PERMISSIONS };
