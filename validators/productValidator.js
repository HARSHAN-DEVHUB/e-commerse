const { z } = require('zod')

const createProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2),
    description: z.string().trim().min(10),
    price: z.coerce.number().positive(),
    category_id: z.coerce.number().int().positive(),
    image_url: z.string().url().optional(),
    stock: z.coerce.number().int().min(0)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
})

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).optional(),
    description: z.string().trim().min(10).optional(),
    price: z.coerce.number().positive().optional(),
    category_id: z.coerce.number().int().positive().optional(),
    image_url: z.string().url().optional(),
    stock: z.coerce.number().int().min(0).optional()
  }).refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided'
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive()
  })
})

module.exports = {
  createProductSchema,
  updateProductSchema
}
