const { z } = require('zod')

const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2),
    email: z.string().email(),
    password: z.string().min(6)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
})

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
})

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).optional(),
    email: z.string().email().optional()
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
})

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema
}
