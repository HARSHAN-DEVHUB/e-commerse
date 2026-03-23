const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomUUID } = require('crypto')
const validate = require('../middleware/validate')
const { authenticateToken } = require('../middleware/auth')
const { authRateLimit } = require('../middleware/rateLimiter')
const AppError = require('../utils/AppError')
const {
  registerSchema,
  loginSchema,
  updateProfileSchema
} = require('../validators/authValidator')
const {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser
} = require('../repositories/userRepository')
const {
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteExpiredRefreshTokens
} = require('../repositories/authRepository')

const router = express.Router()

function createAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  )
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
}

router.post('/register', authRateLimit, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.validated.body

    const existing = await findUserByEmail(email)
    if (existing) {
      throw new AppError(400, 'USER_EXISTS', 'User already exists')
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await createUser({
      name,
      email,
      passwordHash,
      role: 'user'
    })

    const accessToken = createAccessToken(user)
    const refreshToken = randomUUID()

    await createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })

    setRefreshCookie(res, refreshToken)

    res.status(201).json({
      success: true,
      data: {
        token: accessToken,
        user
      }
    })
  } catch (error) {
    next(error)
  }
})

router.post('/login', authRateLimit, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated.body

    const user = await findUserByEmail(email)
    if (!user) {
      throw new AppError(400, 'INVALID_CREDENTIALS', 'Invalid credentials')
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      throw new AppError(400, 'INVALID_CREDENTIALS', 'Invalid credentials')
    }

    const accessToken = createAccessToken(user)
    const refreshToken = randomUUID()

    await deleteExpiredRefreshTokens()
    await createRefreshToken({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })

    setRefreshCookie(res, refreshToken)

    res.json({
      success: true,
      data: {
        token: accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

router.post('/refresh', authRateLimit, async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken
    if (!refreshToken) {
      throw new AppError(401, 'AUTH_REQUIRED', 'Refresh token required')
    }

    const stored = await findRefreshToken(refreshToken)
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError(403, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token')
    }

    const user = await findUserById(stored.userId)
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found')
    }

    const accessToken = createAccessToken(user)

    res.json({
      success: true,
      data: { token: accessToken }
    })
  } catch (error) {
    next(error)
  }
})

router.post('/logout', async (req, res, next) => {
  try {
    const refreshToken = req.cookies.refreshToken
    if (refreshToken) {
      await deleteRefreshToken(refreshToken)
    }

    res.clearCookie('refreshToken')
    res.json({
      success: true,
      data: { message: 'Logged out successfully' }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/verify', authenticateToken, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.userId)
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found')
    }

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    next(error)
  }
})

router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const user = await findUserById(req.user.userId)
    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found')
    }

    res.json({ success: true, data: user })
  } catch (error) {
    next(error)
  }
})

router.put('/profile', authenticateToken, validate(updateProfileSchema), async (req, res, next) => {
  try {
    const { name, email } = req.validated.body

    if (email) {
      const existing = await findUserByEmail(email)
      if (existing && existing.id !== req.user.userId) {
        throw new AppError(400, 'EMAIL_IN_USE', 'Email already in use')
      }
    }

    const user = await updateUser(req.user.userId, {
      ...(name ? { name } : {}),
      ...(email ? { email } : {})
    })

    res.json({
      success: true,
      data: {
        message: 'Profile updated successfully',
        user
      }
    })
  } catch (error) {
    next(error)
  }
})

module.exports = router
