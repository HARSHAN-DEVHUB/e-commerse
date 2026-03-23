const rateLimit = require('express-rate-limit')

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many authentication requests, please try again later.',
      details: null
    }
  }
})

const writeRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.WRITE_RATE_LIMIT_MAX || 120),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many write requests, please try again later.',
      details: null
    }
  }
})

module.exports = {
  authRateLimit,
  writeRateLimit
}
