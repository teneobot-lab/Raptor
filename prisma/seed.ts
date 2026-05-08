import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@nodepos.com' },
    update: {},
    create: {
      email: 'admin@nodepos.com',
      name: 'Admin Manager',
      password: bcrypt.hashSync('admin', 10),
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'kasir@nodepos.com' },
    update: {},
    create: {
      email: 'kasir@nodepos.com',
      name: 'Staff Kasir',
      password: bcrypt.hashSync('kasir', 10),
      role: 'CASHIER',
    },
  });

  await prisma.product.createMany({
    data: [
        { name: 'MacBook Pro 16"', price: 2500, stock: 12, category: 'Laptops', barcode: '885909950854' },
        { name: 'Logitech MX Master 3S', price: 99, stock: 45, category: 'Accessories', barcode: '097855152341' },
        { name: 'Dell UltraSharp 27"', price: 450, stock: 8, category: 'Monitors', barcode: '539718420015' },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
