const request = require('supertest')
const { PrismaClient } = require('@prisma/client')
const app = require('../../server')

const prisma = new PrismaClient()
const uniqueEmail = `test_${Date.now()}@example.com`
let token = ''

beforeAll(async () => {
  await prisma.refreshToken.deleteMany({ where: { user: { email: uniqueEmail } } })
  await prisma.user.deleteMany({ where: { email: uniqueEmail } })
})

afterAll(async () => {
  await prisma.refreshToken.deleteMany({ where: { user: { email: uniqueEmail } } })
  await prisma.user.deleteMany({ where: { email: uniqueEmail } })
  await prisma.$disconnect()
})

describe('auth flow', () => {
  it('registers a user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: uniqueEmail,
        password: 'password123'
      })

    expect(response.status).toBe(201)
    expect(response.body.success).toBe(true)
    expect(response.body.data.user.email).toBe(uniqueEmail)
  })

  it('logs in and verifies token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({
        email: uniqueEmail,
        password: 'password123'
      })

    expect(login.status).toBe(200)
    expect(login.body.success).toBe(true)

    token = login.body.data.token

    const verify = await request(app)
      .get('/api/auth/verify')
      .set('Authorization', `Bearer ${token}`)

    expect(verify.status).toBe(200)
    expect(verify.body.success).toBe(true)
    expect(verify.body.data.email).toBe(uniqueEmail)
  })
})
