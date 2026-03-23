const prisma = require('../lib/prisma')

async function listCategories({ skip, take }) {
  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      skip,
      take,
      orderBy: { id: 'asc' },
      include: {
        _count: {
          select: { products: true }
        }
      }
    }),
    prisma.category.count()
  ])

  return { categories, total }
}

async function findCategoryById(id) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true }
      }
    }
  })
}

async function createCategory(data) {
  return prisma.category.create({ data })
}

async function updateCategory(id, data) {
  return prisma.category.update({ where: { id }, data })
}

async function deleteCategory(id) {
  return prisma.category.delete({ where: { id } })
}

module.exports = {
  listCategories,
  findCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
}
