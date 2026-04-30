import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '@ecommerce/shared';

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@shopflow.com' } });
  if (existing) {
    console.log('Admin already exists');
    return;
  }

  await prisma.user.create({
    data: {
      email: 'admin@shopflow.com',
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      firstName: 'Admin',
      lastName: 'ShopFlow',
      role: 'admin',
    },
  });

  console.log('Admin seeded: admin@shopflow.com / admin123');
}

main().then(() => prisma.$disconnect()).catch(console.error);
