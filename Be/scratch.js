const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const services = await prisma.service.findMany({
    include: { provider: { include: { providerWallet: true } } }
  });
  console.log(JSON.stringify(services.map(s => ({
    id: s.id,
    name: s.name,
    status: s.status,
    isDeleted: s.isDeleted,
    provider: {
      id: s.provider.id,
      status: s.provider.status,
      wallet: s.provider.providerWallet
    }
  })), null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
