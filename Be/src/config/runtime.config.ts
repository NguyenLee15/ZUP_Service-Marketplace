import 'dotenv/config';
import { registerAs } from '@nestjs/config';

export type RuntimeProfile = 'local' | 'free' | 'prod';
export type QueueMode = 'inline' | 'redis';

const TRUE_VALUES = new Set(['1', 'true', 'yes', 'on']);

function parseBoolean(value: string | undefined, fallback = false): boolean {
  if (value === undefined || value === '') return fallback;
  return TRUE_VALUES.has(value.trim().toLowerCase());
}

export function getRuntimeProfile(): RuntimeProfile {
  const value = (process.env.RUNTIME_PROFILE || 'local').trim().toLowerCase();
  if (value === 'free' || value === 'prod') return value;
  return 'local';
}

export function isRedisEnabled(): boolean {
  const profile = getRuntimeProfile();
  return parseBoolean(process.env.REDIS_ENABLED, profile === 'prod');
}

export function getQueueMode(): QueueMode {
  const requestedMode = (process.env.QUEUE_MODE || '').trim().toLowerCase();
  if (requestedMode === 'redis' && isRedisEnabled()) return 'redis';
  return 'inline';
}

export function isRedisQueueEnabled(): boolean {
  return isRedisEnabled() && getQueueMode() === 'redis';
}

export function isWorkerEnabled(): boolean {
  return (
    isRedisQueueEnabled() && parseBoolean(process.env.WORKER_ENABLED, false)
  );
}

export function isCronEnabled(): boolean {
  return parseBoolean(process.env.CRON_ENABLED, false);
}

export default registerAs('runtime', () => ({
  profile: getRuntimeProfile(),
  redisEnabled: isRedisEnabled(),
  queueMode: getQueueMode(),
  workerEnabled: isWorkerEnabled(),
  cronEnabled: isCronEnabled(),
}));
