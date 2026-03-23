const pino = require('pino')
const pinoHttp = require('pino-http')

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true
        }
      }
    : undefined
})

const httpLogger = pinoHttp({
  logger,
  customProps: (req) => ({
    requestId: req.requestId
  }),
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  }
})

module.exports = {
  logger,
  httpLogger
}
