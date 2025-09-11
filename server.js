const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const path = require('path')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')))

// API Routes
app.use('/api/auth', require('./routes/auth.js'))
app.use('/api/products', require('./routes/products.js'))
app.use('/api/categories', require('./routes/categories.js'))
app.use('/api/orders', require('./routes/orders.js'))
app.use('/api/users', require('./routes/users.js'))

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 