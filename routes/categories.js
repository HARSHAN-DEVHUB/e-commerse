const express = require('express')
const router = express.Router()
const pool = require('../config/db')

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id')
    res.json(result.rows)
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ message: 'Failed to fetch categories' })
  }
})

// Get single category
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Category not found' })
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('Error fetching category:', error)
    res.status(500).json({ message: 'Failed to fetch category' })
  }
})

module.exports = router 