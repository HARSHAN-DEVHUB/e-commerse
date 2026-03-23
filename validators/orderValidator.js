const { z } = require('zod')

const orderItem = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive()
})

const shippingAddress = z.object({
  fullName: z.string().min(2),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(3),
  country: z.string().min(2)
})

const createOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItem).min(1),
    shippingAddress,
    paymentMethod: z.string().min(2)
  }),
  query: z.object({}).optional(),
  params: z.object({}).optional()
})

const updateOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
  }),
  query: z.object({}).optional(),
  params: z.object({
    id: z.coerce.number().int().positive()
  })
})

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema
}
