import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const query = "máy điều hòa bị hỏng không mát";
  
  const apiKey = process.env.OPENAI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text: query }] }
    })
  });
  
  const data = await res.json() as any;
  const embedding = data?.embedding?.values;
  
  if (!embedding) {
      console.log("No embedding generated:", data);
      return;
  }
  
  const vectorStr = `[${embedding.join(',')}]`;
  const rawResults = await prisma.$queryRawUnsafe<any[]>(`
    SELECT s.id, s.name, 1 - (s.embedding <=> '${vectorStr}'::vector) as similarity
    FROM services s
    WHERE s.status = 'ACTIVE' AND s.is_deleted = false AND s.embedding IS NOT NULL
    ORDER BY s.embedding <=> '${vectorStr}'::vector
    LIMIT 10
  `);
  
  console.log("Query:", query);
  for (const r of rawResults) {
      console.log(`- ${r.similarity.toFixed(4)} : ${r.name}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
