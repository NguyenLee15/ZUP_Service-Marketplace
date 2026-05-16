import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const catCount = await prisma.serviceCategory.count();
  const serviceCount = await prisma.service.count();
  const userCount = await prisma.user.count();
  console.log(`Categories: ${catCount}`);
  console.log(`Services: ${serviceCount}`);
  console.log(`Users: ${userCount}`);
}
main().finally(() => prisma.$disconnect());
