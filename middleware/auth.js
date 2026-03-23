const jwt = require('jsonwebtoken')
const AppError = require('../utils/AppError')

function authenticateToken(req, _res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return next(new AppError(401, 'AUTH_REQUIRED', 'Access token required'))
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    return next()
  } catch (_error) {
    return next(new AppError(403, 'INVALID_TOKEN', 'Invalid or expired token'))
  }
}

function requireAdmin(req, _res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError(403, 'ADMIN_REQUIRED', 'Admin access required'))
  }
  return next()
}

module.exports = {
  authenticateToken,
  requireAdmin
}
