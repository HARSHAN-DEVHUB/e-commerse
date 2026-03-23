const { z } = require('zod')

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
})

const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80)
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive()
  })
})

module.exports = {
  createCategorySchema,
  updateCategorySchema
}