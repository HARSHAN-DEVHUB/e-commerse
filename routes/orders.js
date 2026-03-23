const express = require('express')
const { Prisma } = require('@prisma/client')
const validate = require('../middleware/validate')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { writeRateLimit } = require('../middleware/rateLimiter')
const { parsePagination, buildPageMeta } = require('../utils/pagination')
const AppError = require('../utils/AppError')
const prisma = require('../lib/prisma')
const { createOrderSchema, updateOrderStatusSchema } = require('../validators/orderValidator')
const {
  listOrders,
  findOrderById,
  updateOrderStatus
} = require('../repositories/orderRepository')

const router = express.Router()

router.post('/', authenticateToken, writeRateLimit, validate(createOrderSchema), async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.validated.body

    const productIds = [...new Set(items.map((item) => item.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, stock: true }
    })

    if (products.length !== productIds.length) {
      throw new AppError(400, 'PRODUCT_NOT_FOUND', 'One or more products were not found')
    }

    const productMap = new Map(products.map((product) => [product.id, product]))

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (item.quantity > product.stock) {
        throw new AppError(400, 'INSUFFICIENT_STOCK', `Insufficient stock for product ${item.productId}`)
      }
    }

    const subtotal = items.reduce((sum, item) => {
      const product = productMap.get(item.productId)
      return sum + Number(product.price) * item.quantity
    }, 0)

    const tax = subtotal * 0.08
    const shipping = subtotal > 50 ? 0 : 5.99
    const total = subtotal + tax + shipping

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        userId: req.user.userId,
        status: 'pending',
        paymentMethod,
        shippingAddress,
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        tax: new Prisma.Decimal(tax.toFixed(2)),
        shipping: new Prisma.Decimal(shipping.toFixed(2)),
        total: new Prisma.Decimal(total.toFixed(2)),
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: productMap.get(item.productId).price
          }))
        }
      })

      const orderWithItems = await tx.order.findUnique({
        where: { id: created.id },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, imageUrl: true }
              }
            }
          }
        }
      })

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })
      }

      await tx.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'ORDER_CREATED',
          entity: 'order',
          entityId: String(created.id),
          details: {
            itemCount: items.length,
            total
          }
        }
      })

      return orderWithItems
    })

    res.status(201).json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
})

router.get('/my-orders', authenticateToken, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const { orders, total } = await listOrders({
      where: { userId: req.user.userId },
      skip,
      take: limit
    })

    res.json({
      success: true,
      data: orders,
      meta: buildPageMeta(page, limit, total)
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const order = await findOrderById(Number(req.params.id))
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found')
    }

    if (order.userId !== req.user.userId && req.user.role !== 'admin') {
      throw new AppError(403, 'ACCESS_DENIED', 'Access denied')
    }

    res.json({ success: true, data: order })
  } catch (error) {
    next(error)
  }
})

router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const status = req.query.status?.trim()
    const userId = req.query.userId ? Number(req.query.userId) : undefined

    const where = {
      ...(status ? { status } : {}),
      ...(userId ? { userId } : {})
    }

    const { orders, total } = await listOrders({ where, skip, take: limit })

    res.json({
      success: true,
      data: orders,
      meta: buildPageMeta(page, limit, total)
    })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/status', authenticateToken, requireAdmin, writeRateLimit, validate(updateOrderStatusSchema), async (req, res, next) => {
  try {
    const order = await updateOrderStatus(Number(req.params.id), req.validated.body.status)

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'ORDER_STATUS_UPDATED',
        entity: 'order',
        entityId: String(order.id),
        details: { status: order.status }
      }
    })

    res.json({ success: true, data: order })
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError(404, 'ORDER_NOT_FOUND', 'Order not found'))
    }
    next(error)
  }
})

router.put('/:id/cancel', authenticateToken, writeRateLimit, async (req, res, next) => {
  try {
    const order = await findOrderById(Number(req.params.id))
    if (!order) {
      throw new AppError(404, 'ORDER_NOT_FOUND', 'Order not found')
    }

    if (order.userId !== req.user.userId) {
      throw new AppError(403, 'ACCESS_DENIED', 'Access denied')
    }

    if (order.status !== 'pending') {
      throw new AppError(400, 'INVALID_ORDER_STATE', 'Only pending orders can be cancelled')
    }

    const cancelled = await updateOrderStatus(order.id, 'cancelled')
    res.json({ success: true, data: cancelled })
  } catch (error) {
    next(error)
  }
})

module.exports = router
