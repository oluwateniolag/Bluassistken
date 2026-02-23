const jwt = require('jsonwebtoken');
const { User, Tenant } = require('../models');

// Protect routes - require authentication
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');

      // Get user from token with tenant included
      const user = await User.findByPk(decoded.id, {
        include: [{
          model: Tenant,
          as: 'tenant'
        }]
      });
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isActive()) {
        return res.status(401).json({
          success: false,
          message: 'User account is not active'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Check tenant access
exports.checkTenantAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Super admin can access all tenants without restrictions
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check if user belongs to a tenant
    if (!req.user.tenant) {
      return res.status(403).json({
        success: false,
        message: 'No tenant associated with user'
      });
    }

    // Check if tenant is active (allow pending status for onboarding)
    if (req.user.tenant.status === 'suspended' || req.user.tenant.status === 'inactive') {
      return res.status(403).json({
        success: false,
        message: 'Tenant account is not active'
      });
    }

    // Attach tenant to request
    req.tenant = req.user.tenant;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Check role authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};
