const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const router = express.Router()
const pool = require('../config/db')

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

// Register
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }
    const { name, email, password } = req.body
    // Check if user already exists
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists' })
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)
    // Create new user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, 'user']
    )
    const user = result.rows[0]
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )
    const { password_hash, ...userWithoutPassword } = user
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Registration failed' })
  }
})

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }
    const { email, password } = req.body
    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }
    const user = result.rows[0]
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' })
    }
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    )
    const { password_hash, ...userWithoutPassword } = user
    res.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Login failed' })
  }
})

// Verify token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    const { password_hash, ...userWithoutPassword } = result.rows[0]
    res.json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({ message: 'Token verification failed' })
  }
})

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' })
    }
    const { password_hash, ...userWithoutPassword } = result.rows[0]
    res.json(userWithoutPassword)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' })
  }
})

// Update user profile
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Valid email required')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }
    const { name, email } = req.body
    // Check if email is already taken by another user
    if (email) {
      const existing = await pool.query('SELECT * FROM users WHERE email = $1 AND id != $2', [email, req.user.userId])
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use' })
      }
    }
    // Update user
    const fields = []
    const values = []
    let idx = 1
    if (name) { fields.push(`name = $${idx++}`); values.push(name) }
    if (email) { fields.push(`email = $${idx++}`); values.push(email) }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' })
    values.push(req.user.userId)
    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )
    const { password_hash, ...userWithoutPassword } = result.rows[0]
    res.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({ message: 'Profile update failed' })
  }
})

module.exports = router 