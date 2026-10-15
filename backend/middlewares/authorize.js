/**
 * Role-based authorization middleware.
 * Must be used AFTER protect middleware (req.user must exist).
 *
 * Usage: authorize('admin') or authorize('admin', 'subadmin')
 * Role is ALWAYS read from req.user (server-side), NEVER from req.body or query.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of these roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Permission-based authorization middleware.
 * Must be used AFTER protect middleware (req.user must exist).
 *
 * Rules:
 * - role 'admin': Full access (always allowed).
 * - role 'subadmin': Only allowed if user.permissions[permission] === true.
 * - any other role: 403 Forbidden.
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated.',
      });
    }

    // Main admin has full privileges
    if (req.user.role === 'admin') {
      return next();
    }

    // Subadmin requires specific permission to be true
    if (req.user.role === 'subadmin') {
      if (req.user.permissions && req.user.permissions[permission] === true) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have '${permission}' permission.`,
      });
    }

    // Any other role (e.g. regular user)
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Administrative privileges required.',
    });
  };
};

module.exports = { authorize, checkPermission };
