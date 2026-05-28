import { registerAs } from '@nestjs/config';
import { isRedisEnabled } from './runtime.config';

export default registerAs('redis', () => {
  const redisUrlStr = process.env.REDIS_URL;
  let host = process.env.REDIS_HOST || 'localhost';
  let port = parseInt(process.env.REDIS_PORT || '6379', 10);
  let password = process.env.REDIS_PASSWORD || undefined;
  let tls: { rejectUnauthorized: boolean } | undefined = undefined;

  if (redisUrlStr) {
    try {
      const url = new URL(redisUrlStr);
      host = url.hostname;
      port = parseInt(url.port || '6379', 10);
      if (url.password) password = url.password;
      if (url.protocol === 'rediss:') tls = { rejectUnauthorized: false };
    } catch {
      // Keep explicit host/port fallback if REDIS_URL is malformed.
    }
  }

  return {
    enabled: isRedisEnabled(),
    host,
    port,
    password,
    tls,
    url: redisUrlStr || undefined,
  };
});
