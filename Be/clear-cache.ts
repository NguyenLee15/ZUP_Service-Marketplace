import Redis from 'ioredis';

async function clearCache() {
  const redis = new Redis("rediss://default:gQAAAAAAAWzKAAIgcDIxMTdmMjc5MjZiMTk0N2I2ODE3NjY1MjgxMDVjM2I5ZA@wise-deer-93386.upstash.io:6379");
  
  const key = "ai_search:điều hòa không mát";
  await redis.del(key);
  console.log(`Deleted cache key: ${key}`);
  
  const keys = await redis.keys('ai_search:*');
  for (const k of keys) {
    await redis.del(k);
    console.log(`Deleted ${k}`);
  }
  
  redis.quit();
}

clearCache().catch(console.error);
