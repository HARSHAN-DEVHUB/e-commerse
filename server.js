const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const path = require('path')
require('dotenv').config()
const { validateEnv } = require('./lib/env')
const requestId = require('./middleware/requestId')
const errorHandler = require('./middleware/errorHandler')
const notFound = require('./middleware/notFound')
const { httpLogger, logger } = require('./lib/logger')

const app = express()
const PORT = process.env.PORT || 5000

validateEnv()
app.set('trust proxy', 1)

// Middleware
app.use(requestId)
app.use(httpLogger)
app.use(helmet())
app.use(compression())
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      timestamp: new Date().toISOString()
    },
    meta: {
      requestId: req.requestId
    }
  })
})

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')))

// API Routes
app.use('/api/auth', require('./routes/auth.js'))
app.use('/api/products', require('./routes/products.js'))
app.use('/api/categories', require('./routes/categories.js'))
app.use('/api/orders', require('./routes/orders.js'))
app.use('/api/users', require('./routes/users.js'))

// Serve React app for any non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next()
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.use(notFound)
app.use(errorHandler)

if (require.main === module) {
  app.listen(PORT, () => {
    logger.info({ port: PORT }, 'Server running')
  })
}

module.exports = app