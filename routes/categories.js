const express = require('express')
const { Prisma } = require('@prisma/client')
const validate = require('../middleware/validate')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { writeRateLimit } = require('../middleware/rateLimiter')
const prisma = require('../lib/prisma')
const { parsePagination, buildPageMeta } = require('../utils/pagination')
const AppError = require('../utils/AppError')
const {
  listCategories,
  findCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} = require('../repositories/categoryRepository')
const { createCategorySchema, updateCategorySchema } = require('../validators/categoryValidator')

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const { categories, total } = await listCategories({ skip, take: limit })

    res.json({
      success: true,
      data: categories,
      meta: buildPageMeta(page, limit, total)
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const category = await findCategoryById(Number(req.params.id))
    if (!category) {
      throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found')
    }
    res.json({ success: true, data: category })
  } catch (error) {
    next(error)
  }
})

router.post('/', authenticateToken, requireAdmin, writeRateLimit, validate(createCategorySchema), async (req, res, next) => {
  try {
    const category = await createCategory({ name: req.validated.body.name })

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'CATEGORY_CREATED',
        entity: 'category',
        entityId: String(category.id),
        details: { name: category.name }
      }
    })

    res.status(201).json({ success: true, data: category })
  } catch (error) {
    if (error.code === 'P2002') {
      return next(new AppError(400, 'CATEGORY_EXISTS', 'Category with this name already exists'))
    }
    next(error)
  }
})

router.put('/:id', authenticateToken, requireAdmin, writeRateLimit, validate(updateCategorySchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const category = await updateCategory(id, { name: req.validated.body.name })

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'CATEGORY_UPDATED',
        entity: 'category',
        entityId: String(category.id),
        details: { name: category.name }
      }
    })

    res.json({ success: true, data: category })
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found'))
    }
    if (error.code === 'P2002') {
      return next(new AppError(400, 'CATEGORY_EXISTS', 'Category with this name already exists'))
    }
    next(error)
  }
})

router.delete('/:id', authenticateToken, requireAdmin, writeRateLimit, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const category = await deleteCategory(id)

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'CATEGORY_DELETED',
        entity: 'category',
        entityId: String(id),
        details: { name: category.name }
      }
    })

    res.json({ success: true, data: { message: 'Category deleted successfully' } })
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError(404, 'CATEGORY_NOT_FOUND', 'Category not found'))
    }
    if (error.code === 'P2003' || error instanceof Prisma.PrismaClientKnownRequestError) {
      return next(new AppError(400, 'CATEGORY_IN_USE', 'Cannot delete category with existing products'))
    }
    next(error)
  }
})

module.exports = router
