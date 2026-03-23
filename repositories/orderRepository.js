const prisma = require('../lib/prisma')

async function createOrder(data) {
  return prisma.order.create({
    data,
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
}

async function listOrders({ where, skip, take }) {
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              select: { id: true, name: true, imageUrl: true }
            }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    }),
    prisma.order.count({ where })
  ])

  return { orders, total }
}

async function findOrderById(id) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, imageUrl: true }
          }
        }
      },
      user: {
        select: { id: true, name: true, email: true }
      }
    }
  })
}

async function updateOrderStatus(id, status) {
  return prisma.order.update({
    where: { id },
    data: { status }
  })
}

module.exports = {
  createOrder,
  listOrders,
  findOrderById,
  updateOrderStatus
}
