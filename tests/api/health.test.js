const request = require('supertest')
const app = require('../../server')

describe('GET /health', () => {
  it('returns service health metadata', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.status).toBe('ok')
    expect(response.body.data.version).toBeDefined()
    expect(response.body.meta.requestId).toBeDefined()
  })
})
