import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const s = await prisma.service.findMany({ select: { id: true, name: true, status: true, isDeleted: true } });
  console.log("Services:");
  for (const x of s) {
    const raw: any = await prisma.$queryRaw`SELECT embedding IS NOT NULL as has_emb FROM services WHERE id = ${x.id}`;
    console.log(`${x.id}: ${x.name} - ${x.status} - del:${x.isDeleted} - emb:${raw[0].has_emb}`);
  }
}
run();
