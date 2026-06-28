import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const apiKey = "AIzaSyBtV1ql9duqjveZHfT789KOsMCk8-M1ubk";

async function testSearch(query: string) {
  console.log(`Searching for: ${query}`);
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: { parts: [{ text: query }] } })
  });
  const data = await response.json();
  if (!data.embedding || !data.embedding.values) {
    console.log("Failed to get embedding for query", data);
    return;
  }
  
  const vectorValues = data.embedding.values.slice(0, 768);
  const vectorStr = `[${vectorValues.join(',')}]`;
  
  const results: any = await prisma.$queryRawUnsafe(`
    SELECT id, name, 1 - (embedding <=> '${vectorStr}'::vector) as similarity
    FROM services
    WHERE status = 'ACTIVE' AND is_deleted = false AND embedding IS NOT NULL
    ORDER BY embedding <=> '${vectorStr}'::vector
    LIMIT 5
  `);
  
  console.log("Results:");
  for (const r of results) {
    console.log(`- ${r.id}: ${r.name} (sim: ${r.similarity})`);
  }
}

const query = process.argv[2] || "máy lạnh nhà tôi bị hỏng";
testSearch(query).then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
