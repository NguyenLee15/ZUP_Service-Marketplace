import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';

const prisma = new PrismaClient();

async function main() {
  const query = "máy lạnh hỏng";
  
  // Need API key for Gemini. 
  // Wait, I can just use raw SQL to find the closest services.
  const services = await prisma.$queryRawUnsafe<any[]>(`
    SELECT id, name, description
    FROM services
    WHERE status = 'ACTIVE' AND is_deleted = false AND embedding IS NOT NULL
  `);
  
  console.log(`Found ${services.length} active services with embeddings`);
  if (services.length > 0) {
    console.log(services.map(s => ({ id: s.id, name: s.name })).slice(0, 10));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
