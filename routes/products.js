const express = require('express')
const path = require('path')
const multer = require('multer')
const { Prisma } = require('@prisma/client')
const validate = require('../middleware/validate')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { writeRateLimit } = require('../middleware/rateLimiter')
const AppError = require('../utils/AppError')
const { parsePagination, buildPageMeta } = require('../utils/pagination')
const {
  listProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../repositories/productRepository')
const { createProductSchema, updateProductSchema, bulkProductActionSchema } = require('../validators/productValidator')
const prisma = require('../lib/prisma')

const router = express.Router()

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase()
    const safeExt = extension || '.jpg'
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('image/')) {
      return cb(null, true)
    }
    return cb(new AppError(400, 'INVALID_IMAGE_TYPE', 'Only image files are allowed'))
  }
})

router.get('/', async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const search = req.query.search?.trim()
    const category = req.query.category?.trim()
    const minPrice = req.query.minPrice ? Number(req.query.minPrice) : undefined
    const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : undefined
    const sortBy = ['name', 'price', 'createdAt'].includes(req.query.sortBy) ? req.query.sortBy : 'id'
    const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc'

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(category
        ? {
            category: {
              name: { equals: category, mode: 'insensitive' }
            }
          }
        : {}),
      ...(minPrice !== undefined || maxPrice !== undefined
        ? {
            price: {
              ...(minPrice !== undefined ? { gte: minPrice } : {}),
              ...(maxPrice !== undefined ? { lte: maxPrice } : {})
            }
          }
        : {})
    }

    const { products, total } = await listProducts({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder }
    })

    res.json({
      success: true,
      data: products.map((p) => ({
        ...p,
        price: Number(p.price),
        category: p.category.name
      })),
      meta: buildPageMeta(page, limit, total)
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const product = await findProductById(id)

    if (!product) {
      throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
    }

    res.json({
      success: true,
      data: {
        ...product,
        price: Number(product.price),
        category: product.category.name
      }
    })
  } catch (error) {
    next(error)
  }
})

router.post('/', authenticateToken, requireAdmin, writeRateLimit, validate(createProductSchema), async (req, res, next) => {
  try {
    const { name, description, price, category_id, image_url, stock } = req.validated.body

    const product = await createProduct({
      name,
      description,
      price: new Prisma.Decimal(price),
      categoryId: category_id,
      imageUrl: image_url || 'https://placehold.co/300x400',
      stock
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'PRODUCT_CREATED',
        entity: 'product',
        entityId: String(product.id),
        details: { name: product.name, stock: product.stock }
      }
    })

    res.status(201).json({ success: true, data: product })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', authenticateToken, requireAdmin, writeRateLimit, validate(updateProductSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { name, description, price, category_id, image_url, stock } = req.validated.body

    const product = await updateProduct(id, {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(price !== undefined ? { price: new Prisma.Decimal(price) } : {}),
      ...(category_id !== undefined ? { categoryId: category_id } : {}),
      ...(image_url !== undefined ? { imageUrl: image_url } : {}),
      ...(stock !== undefined ? { stock } : {})
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'PRODUCT_UPDATED',
        entity: 'product',
        entityId: String(product.id),
        details: { fields: Object.keys(req.validated.body) }
      }
    })

    res.json({ success: true, data: product })
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found'))
    }
    next(error)
  }
})

router.delete('/:id', authenticateToken, requireAdmin, writeRateLimit, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const product = await deleteProduct(id)

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'PRODUCT_DELETED',
        entity: 'product',
        entityId: String(id),
        details: { name: product.name }
      }
    })

    res.json({
      success: true,
      data: {
        message: 'Product deleted successfully',
        product
      }
    })
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found'))
    }
    next(error)
  }
})

router.post('/bulk', authenticateToken, requireAdmin, writeRateLimit, validate(bulkProductActionSchema), async (req, res, next) => {
  try {
    const { ids, action, value } = req.validated.body

    const result = await prisma.$transaction(async (tx) => {
      if (action === 'adjustStock') {
        const products = await tx.product.findMany({
          where: { id: { in: ids } },
          select: { id: true, stock: true }
        })

        if (products.length !== ids.length) {
          throw new AppError(404, 'PRODUCT_NOT_FOUND', 'One or more selected products were not found')
        }

        for (const product of products) {
          const nextStock = product.stock + value
          if (nextStock < 0) {
            throw new AppError(400, 'INVALID_STOCK_UPDATE', `Stock cannot be negative for product ${product.id}`)
          }
        }

        await Promise.all(
          products.map((product) => tx.product.update({
            where: { id: product.id },
            data: { stock: { increment: value } }
          }))
        )

        return { updatedCount: products.length }
      }

      if (action === 'setCategory') {
        const categoryExists = await tx.category.findUnique({ where: { id: value } })
        if (!categoryExists) {
          throw new AppError(404, 'CATEGORY_NOT_FOUND', 'Selected category not found')
        }

        const updated = await tx.product.updateMany({
          where: { id: { in: ids } },
          data: { categoryId: value }
        })

        return { updatedCount: updated.count }
      }

      const deleted = await tx.product.deleteMany({ where: { id: { in: ids } } })
      return { deletedCount: deleted.count }
    })

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'PRODUCT_BULK_ACTION',
        entity: 'product',
        details: {
          action,
          count: ids.length,
          value: value ?? null
        }
      }
    })

    res.json({ success: true, data: result })
  } catch (error) {
    if (error.code === 'P2003') {
      return next(new AppError(400, 'PRODUCT_IN_USE', 'Cannot delete products that are linked to existing orders'))
    }
    next(error)
  }
})

router.post('/:id/image', authenticateToken, requireAdmin, writeRateLimit, upload.single('image'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)

    if (!req.file) {
      throw new AppError(400, 'IMAGE_REQUIRED', 'Please provide an image file')
    }

    const imagePath = `/uploads/${req.file.filename}`
    const product = await updateProduct(id, { imageUrl: imagePath })

    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'PRODUCT_IMAGE_UPDATED',
        entity: 'product',
        entityId: String(product.id),
        details: { imagePath }
      }
    })

    res.json({
      success: true,
      data: {
        message: 'Product image updated successfully',
        product
      }
    })
  } catch (error) {
    if (error.code === 'P2025') {
      return next(new AppError(404, 'PRODUCT_NOT_FOUND', 'Product not found'))
    }
    next(error)
  }
})

module.exports = router
