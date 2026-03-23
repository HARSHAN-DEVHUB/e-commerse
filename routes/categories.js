const express = require('express')
const { parsePagination, buildPageMeta } = require('../utils/pagination')
const AppError = require('../utils/AppError')
const { listCategories, findCategoryById } = require('../repositories/categoryRepository')

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

module.exports = router
