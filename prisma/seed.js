const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const categories = ['T-Shirts', 'Hoodies', 'Jeans', 'Accessories']

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  const adminPasswordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'password123', 10)

  await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@stylehub.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@stylehub.com',
      passwordHash: adminPasswordHash,
      role: 'admin'
    }
  })

  const userPasswordHash = await bcrypt.hash('password123', 10)

  await prisma.user.upsert({
    where: { email: 'user@stylehub.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'user@stylehub.com',
      passwordHash: userPasswordHash,
      role: 'user'
    }
  })

  const allCategories = await prisma.category.findMany()
  const categoryByName = Object.fromEntries(allCategories.map((c) => [c.name, c.id]))

  const products = [
    {
      name: 'Classic White Tee',
      description: 'A premium cotton white t-shirt for daily wear.',
      price: 24.99,
      stock: 120,
      categoryId: categoryByName['T-Shirts'],
      imageUrl: 'https://placehold.co/600x800?text=Classic+White+Tee'
    },
    {
      name: 'Urban Black Hoodie',
      description: 'Warm fleece hoodie with modern fit and front pocket.',
      price: 59.99,
      stock: 60,
      categoryId: categoryByName['Hoodies'],
      imageUrl: 'https://placehold.co/600x800?text=Urban+Black+Hoodie'
    },
    {
      name: 'Slim Denim Jeans',
      description: 'Stretch denim jeans with a clean slim silhouette.',
      price: 74.5,
      stock: 45,
      categoryId: categoryByName['Jeans'],
      imageUrl: 'https://placehold.co/600x800?text=Slim+Denim+Jeans'
    },
    {
      name: 'Street Cap',
      description: 'Adjustable cotton cap with embroidered logo detail.',
      price: 19.0,
      stock: 90,
      categoryId: categoryByName['Accessories'],
      imageUrl: 'https://placehold.co/600x800?text=Street+Cap'
    }
  ]

  for (const product of products) {
    const existing = await prisma.product.findFirst({ where: { name: product.name } })
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          description: product.description,
          price: product.price,
          stock: product.stock,
          categoryId: product.categoryId,
          imageUrl: product.imageUrl
        }
      })
    } else {
      await prisma.product.create({ data: product })
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
