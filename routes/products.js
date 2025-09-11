const express = require('express')
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
  const jwt = require('jsonwebtoken')
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

// Get all products
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT p.*, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ message: 'Failed to fetch products' })
  }
})

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT p.*, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1', [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ message: 'Failed to fetch product' })
  }
})

// Create product (admin only)
router.post('/', authenticateToken, requireAdmin, [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category_id').isInt().withMessage('Category ID is required'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }
    const { name, description, price, category_id, image_url, stock } = req.body
    const result = await pool.query(
      'INSERT INTO products (name, description, price, category_id, image_url, stock) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, category_id, image_url || 'https://placehold.co/300x400', stock]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Error creating product:', error)
    res.status(500).json({ message: 'Failed to create product' })
  }
})

// Update product (admin only)
router.put('/:id', authenticateToken, requireAdmin, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('category_id').optional().isInt().withMessage('Category ID is required'),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be a non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }
    const { name, description, price, category_id, image_url, stock } = req.body
    const fields = []
    const values = []
    let idx = 1
    if (name) { fields.push(`name = $${idx++}`); values.push(name) }
    if (description) { fields.push(`description = $${idx++}`); values.push(description) }
    if (price) { fields.push(`price = $${idx++}`); values.push(price) }
    if (category_id) { fields.push(`category_id = $${idx++}`); values.push(category_id) }
    if (image_url) { fields.push(`image_url = $${idx++}`); values.push(image_url) }
    if (stock !== undefined) { fields.push(`stock = $${idx++}`); values.push(stock) }
    if (fields.length === 0) return res.status(400).json({ message: 'No fields to update' })
    values.push(req.params.id)
    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    )
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' })
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ message: 'Failed to update product' })
  }
})

// Delete product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found' })
    res.json({ message: 'Product deleted successfully', product: result.rows[0] })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ message: 'Failed to delete product' })
  }
})

// Search products
router.get('/search/:query', async (req, res) => {
  try {
    const query = `%${req.params.query.toLowerCase()}%`
    const result = await pool.query(
      `SELECT p.*, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE LOWER(p.name) LIKE $1 OR LOWER(p.description) LIKE $1`,
      [query]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error searching products:', error)
    res.status(500).json({ message: 'Failed to search products' })
  }
})

// Get products by category
router.get('/category/:category', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE LOWER(c.name) = $1`,
      [req.params.category.toLowerCase()]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching products by category:', error)
    res.status(500).json({ message: 'Failed to fetch products by category' })
  }
})

module.exports = router 