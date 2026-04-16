const ROLES = {
  admin: ['admin', 'sales', 'analyst', 'user'],
  sales: ['sales', 'user'],
  analyst: ['analyst', 'user'],
  user: ['user']
};

const rbac = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
    }

    const userRole = req.user.role;
    const permittedRoles = allowedRoles.flat();

    if (permittedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden', message: 'Insufficient permissions' });
  };
};

const requireAdmin = rbac('admin');
const requireAgent = rbac('admin', 'sales', 'analyst');

module.exports = { rbac, requireAdmin, requireAgent, ROLES };
