const express = require('express')
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
const { createProductSchema, updateProductSchema } = require('../validators/productValidator')

const router = express.Router()

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

module.exports = router
