const prisma = require('../lib/prisma')

async function listCategories({ skip, take }) {
  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      skip,
      take,
      orderBy: { id: 'asc' }
    }),
    prisma.category.count()
  ])

  return { categories, total }
}

async function findCategoryById(id) {
  return prisma.category.findUnique({ where: { id } })
}

module.exports = {
  listCategories,
  findCategoryById
}
