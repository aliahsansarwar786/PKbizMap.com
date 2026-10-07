/**
 * Role-based authorization middleware.
 * Must be used AFTER protect middleware (req.user must exist).
 *
 * Usage: authorize('admin') or authorize('admin', 'user')
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

module.exports = { authorize };
