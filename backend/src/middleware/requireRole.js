export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const err = new Error('Forbidden');
      err.status = 403;
      throw err;
    }
    next();
  };
}