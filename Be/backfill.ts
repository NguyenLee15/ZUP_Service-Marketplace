import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apiKey = "AIzaSyBtV1ql9duqjveZHfT789KOsMCk8-M1ubk";

async function backfill() {
  const services = await prisma.$queryRaw`SELECT id, name, description FROM services WHERE embedding IS NULL AND status = 'ACTIVE'`;
  console.log(`Found ${Array.isArray(services) ? services.length : 0} active services without embeddings.`);
  if (Array.isArray(services)) {
    for (const service of services) {
      const text = `${service.name} ${service.description || ''}`;
      console.log(`Processing service ${service.id}: ${service.name}`);
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: { parts: [{ text }] } })
        });
        const data = await response.json();
        if (data.embedding && data.embedding.values) {
          const vectorValues = data.embedding.values.slice(0, 768);
          const vectorStr = `[${vectorValues.join(',')}]`;
          await prisma.$executeRawUnsafe(`UPDATE services SET embedding = '${vectorStr}'::vector WHERE id = ${service.id}`);
          console.log(`✅ Updated service ${service.id}`);
        } else {
          console.error(`❌ Failed to update service ${service.id}`, data);
        }
      } catch (error) {
        console.error(`❌ Error on service ${service.id}`, error);
      }
    }
  }
  console.log("Done");
}

backfill().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
