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

const bulkProductActionSchema = z.object({
  body: z.object({
    ids: z.array(z.coerce.number().int().positive()).min(1).max(200),
    action: z.enum(['adjustStock', 'setCategory', 'delete']),
    value: z.coerce.number().optional()
  }).superRefine((value, ctx) => {
    if (value.action === 'adjustStock') {
      if (value.value === undefined || Number.isNaN(value.value) || !Number.isInteger(value.value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: 'Integer value is required for adjustStock'
        })
      }
    }

    if (value.action === 'setCategory') {
      if (value.value === undefined || Number.isNaN(value.value) || !Number.isInteger(value.value) || value.value <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: 'Positive category id is required for setCategory'
        })
      }
    }
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
})

module.exports = {
  createProductSchema,
  updateProductSchema,
  bulkProductActionSchema
}
