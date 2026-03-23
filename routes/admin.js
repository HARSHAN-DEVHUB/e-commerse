const express = require('express')
const prisma = require('../lib/prisma')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { parsePagination, buildPageMeta } = require('../utils/pagination')

const router = express.Router()

router.use(authenticateToken, requireAdmin)

router.get('/dashboard/summary', async (req, res, next) => {
  try {
    const lowStockThreshold = Number(req.query.lowStockThreshold || 5)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const [
      productCount,
      categoryCount,
      customerCount,
      orderCount,
      todayOrderCount,
      lowStockCount,
      totalRevenueAggregate,
      todayRevenueAggregate,
      topItems,
      recentOrders
    ] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.user.count({ where: { role: 'user' } }),
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.product.count({ where: { stock: { lte: lowStockThreshold } } }),
      prisma.order.aggregate({
        where: { status: { not: 'cancelled' } },
        _sum: { total: true }
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfToday },
          status: { not: 'cancelled' }
        },
        _sum: { total: true }
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      })
    ])

    const topProductIds = topItems.map((item) => item.productId)
    const topProducts = topProductIds.length
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true, stock: true, price: true }
        })
      : []

    const productMap = new Map(topProducts.map((product) => [product.id, product]))

    res.json({
      success: true,
      data: {
        metrics: {
          products: productCount,
          categories: categoryCount,
          customers: customerCount,
          orders: orderCount,
          ordersToday: todayOrderCount,
          lowStockCount,
          totalRevenue: Number(totalRevenueAggregate._sum.total || 0),
          todayRevenue: Number(todayRevenueAggregate._sum.total || 0)
        },
        topProducts: topItems.map((item) => ({
          productId: item.productId,
          quantitySold: item._sum.quantity || 0,
          name: productMap.get(item.productId)?.name || 'Unknown Product',
          stock: productMap.get(item.productId)?.stock ?? 0,
          price: Number(productMap.get(item.productId)?.price || 0)
        })),
        recentOrders
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/inventory/low-stock', async (req, res, next) => {
  try {
    const threshold = Number(req.query.threshold || 5)
    const products = await prisma.product.findMany({
      where: { stock: { lte: threshold } },
      orderBy: [{ stock: 'asc' }, { id: 'asc' }],
      take: 50,
      include: {
        category: {
          select: { name: true }
        }
      }
    })

    res.json({
      success: true,
      data: products.map((product) => ({
        ...product,
        price: Number(product.price),
        category: product.category.name
      }))
    })
  } catch (error) {
    next(error)
  }
})

router.get('/audit-logs', async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const entity = req.query.entity?.trim()
    const action = req.query.action?.trim()

    const where = {
      ...(entity ? { entity } : {}),
      ...(action ? { action: { contains: action, mode: 'insensitive' } } : {})
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      }),
      prisma.auditLog.count({ where })
    ])

    res.json({
      success: true,
      data: logs,
      meta: buildPageMeta(page, limit, total)
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router