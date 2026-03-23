const { logger } = require('../lib/logger')

function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500
  const code = err.code || 'INTERNAL_SERVER_ERROR'
  const message = statusCode >= 500 ? 'An unexpected error occurred' : err.message

  logger.error({
    err,
    requestId: req.requestId,
    path: req.originalUrl,
    method: req.method,
    statusCode
  })

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details: err.details || null
    },
    meta: {
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    }
  })
}

module.exports = errorHandler
