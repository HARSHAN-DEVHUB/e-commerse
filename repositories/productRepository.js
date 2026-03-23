const prisma = require('../lib/prisma')

async function listProducts({ where, skip, take, orderBy }) {
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        category: {
          select: { name: true }
        }
      }
    }),
    prisma.product.count({ where })
  ])

  return { products, total }
}

async function findProductById(id) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: {
        select: { name: true }
      }
    }
  })
}

async function createProduct(data) {
  return prisma.product.create({ data })
}

async function updateProduct(id, data) {
  return prisma.product.update({ where: { id }, data })
}

async function deleteProduct(id) {
  return prisma.product.delete({ where: { id } })
}

module.exports = {
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct
}
