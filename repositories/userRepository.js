const prisma = require('../lib/prisma')

async function createUser(data) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } })
}

async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  })
}

async function listUsers({ where, skip, take }) {
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    }),
    prisma.user.count({ where })
  ])

  return { users, total }
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  updateUser,
  listUsers
}
