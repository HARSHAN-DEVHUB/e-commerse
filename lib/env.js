const requiredEnv = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET']

function validateEnv() {
  const missing = requiredEnv.filter((name) => !process.env[name])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

module.exports = { validateEnv }
