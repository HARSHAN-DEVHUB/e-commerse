const express = require('express')
const { body, validationResult } = require('express-validator')
const router = express.Router()

// In-memory storage (replace with database in production)
let orders = []

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

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' })
  }
  next()
}

// Create order
router.post('/', authenticateToken, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shippingAddress').isObject().withMessage('Shipping address is required'),
  body('paymentMethod').notEmpty().withMessage('Payment method is required')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const { items, shippingAddress, paymentMethod, total } = req.body

    const newOrder = {
      id: Date.now().toString(),
      userId: req.user.userId,
      items,
      shippingAddress,
      paymentMethod,
      total,
      status: 'pending',
      createdAt: new Date()
    }

    orders.push(newOrder)
    res.status(201).json(newOrder)
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ message: 'Failed to create order' })
  }
})

// Get user orders
router.get('/my-orders', authenticateToken, (req, res) => {
  try {
    const userOrders = orders.filter(order => order.userId === req.user.userId)
    res.json(userOrders)
  } catch (error) {
    console.error('Error fetching user orders:', error)
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
})

// Get single order
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const order = orders.find(o => o.id === req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    // Check if user owns the order or is admin
    if (order.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ message: 'Failed to fetch order' })
  }
})

// Get all orders (admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    res.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ message: 'Failed to fetch orders' })
  }
})

// Update order status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, [
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status')
], (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg })
    }

    const orderIndex = orders.findIndex(o => o.id === req.params.id)
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' })
    }

    orders[orderIndex].status = req.body.status
    res.json(orders[orderIndex])
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({ message: 'Failed to update order status' })
  }
})

// Cancel order
router.put('/:id/cancel', authenticateToken, (req, res) => {
  try {
    const orderIndex = orders.findIndex(o => o.id === req.params.id)
    if (orderIndex === -1) {
      return res.status(404).json({ message: 'Order not found' })
    }

    const order = orders[orderIndex]
    
    // Check if user owns the order
    if (order.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' })
    }

    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' })
    }

    order.status = 'cancelled'
    res.json(order)
  } catch (error) {
    console.error('Error cancelling order:', error)
    res.status(500).json({ message: 'Failed to cancel order' })
  }
})

module.exports = router 