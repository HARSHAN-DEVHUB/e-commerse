const AppError = require('../utils/AppError')

function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    })

    if (!result.success) {
      return next(new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', result.error.flatten()))
    }

    req.validated = result.data
    next()
  }
}

module.exports = validate
