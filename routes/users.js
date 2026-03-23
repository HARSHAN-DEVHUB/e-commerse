const express = require('express')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { parsePagination, buildPageMeta } = require('../utils/pagination')
const AppError = require('../utils/AppError')
const { findUserById, listUsers } = require('../repositories/userRepository')

const router = express.Router()

router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { page, limit, skip } = parsePagination(req.query)
    const search = req.query.search?.trim()
    const role = req.query.role?.trim()

    const where = {
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(role ? { role } : {})
    }

    const { users, total } = await listUsers({ where, skip, take: limit })

    res.json({
      success: true,
      data: users,
      meta: buildPageMeta(page, limit, total)
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const user = await findUserById(Number(req.params.id))
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found')
    }

    res.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})

module.exports = router
