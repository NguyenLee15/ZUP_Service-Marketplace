import { RedisIoAdapter } from './redis-io.adapter';

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    duplicate: jest.fn().mockReturnValue({
      ping: jest.fn().mockResolvedValue('PONG'),
      quit: jest.fn().mockResolvedValue('OK'),
    }),
    ping: jest.fn().mockResolvedValue('PONG'),
    quit: jest.fn().mockResolvedValue('OK'),
  }));
});

describe('RedisIoAdapter', () => {
  const config = (values: Record<string, unknown>) => ({
    get: jest.fn((key: string, fallback?: unknown) => values[key] ?? fallback),
  });

  it('keeps the default in-memory adapter when Redis is disabled', async () => {
    const adapter = new RedisIoAdapter(
      {} as never,
      config({ 'redis.enabled': false }) as never,
    );

    await expect(adapter.connectToRedis()).resolves.toBeUndefined();
    expect(adapter.isRedisAdapterEnabled()).toBe(false);
  });

  it('initializes Redis pub/sub when Redis is enabled and closes both clients', async () => {
    const adapter = new RedisIoAdapter(
      {} as never,
      config({
        'redis.enabled': true,
        'redis.url': 'redis://localhost:6379',
      }) as never,
    );

    await adapter.connectToRedis();

    expect(adapter.isRedisAdapterEnabled()).toBe(true);
    await expect(adapter.close()).resolves.toBeUndefined();
  });
});
