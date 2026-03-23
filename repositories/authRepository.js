const prisma = require('../lib/prisma')

async function createRefreshToken(data) {
  return prisma.refreshToken.create({ data })
}

async function findRefreshToken(token) {
  return prisma.refreshToken.findUnique({ where: { token } })
}

async function deleteRefreshToken(token) {
  return prisma.refreshToken.deleteMany({ where: { token } })
}

async function deleteExpiredRefreshTokens() {
  return prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date()
      }
    }
  })
}

module.exports = {
  createRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteExpiredRefreshTokens
}
