import { EventEmitter } from 'node:events';
import { Adapter } from 'socket.io-adapter';
import { RedisIoAdapter } from './redis-io.adapter';

type MockRedisClient = EventEmitter & {
  options: unknown;
  ping: jest.Mock;
  duplicate: jest.Mock;
  quit: jest.Mock;
  disconnect: jest.Mock;
};

const mockRedisClients: MockRedisClient[] = [];
const mockCreateAdapter = jest.fn((..._args: unknown[]) => jest.fn());
let mockPingShouldFail = false;

jest.mock('ioredis', () =>
  jest.fn().mockImplementation((...args: unknown[]) => {
    const client = new EventEmitter() as MockRedisClient;
    client.options = args;
    client.ping = jest.fn(() =>
      mockPingShouldFail
        ? Promise.reject(new Error('ECONNREFUSED'))
        : Promise.resolve('PONG'),
    );
    client.quit = jest.fn().mockResolvedValue('OK');
    client.disconnect = jest.fn();
    client.duplicate = jest.fn().mockImplementation(() => {
      const duplicate = new EventEmitter() as MockRedisClient;
      duplicate.options = args;
      duplicate.ping = jest.fn(() =>
        mockPingShouldFail
          ? Promise.reject(new Error('ECONNREFUSED'))
          : Promise.resolve('PONG'),
      );
      duplicate.quit = jest.fn().mockResolvedValue('OK');
      duplicate.disconnect = jest.fn();
      mockRedisClients.push(duplicate);
      return duplicate;
    });
    mockRedisClients.push(client);
    return client;
  }),
);

jest.mock('@socket.io/redis-adapter', () => ({
  createAdapter: (...args: unknown[]) => mockCreateAdapter(...args),
}));

describe('RedisIoAdapter', () => {
  const config = (values: Record<string, unknown>) => ({
    get: jest.fn((key: string, fallback?: unknown) => values[key] ?? fallback),
  });

  beforeEach(() => {
    mockRedisClients.length = 0;
    mockPingShouldFail = false;
    mockCreateAdapter.mockClear();
    mockCreateAdapter.mockImplementation(() => jest.fn());
  });

  it('keeps the default in-memory adapter when Redis is disabled', async () => {
    const adapter = new RedisIoAdapter(
      {} as never,
      config({ 'redis.enabled': false }) as never,
    );

    await expect(adapter.connectToRedis()).resolves.toBeUndefined();
    expect(adapter.isRedisAdapterEnabled()).toBe(false);
    expect(adapter.isDegraded()).toBe(false);
  });

  it('configures bounded retries and error listeners', async () => {
    const adapter = new RedisIoAdapter(
      {} as never,
      config({
        'redis.enabled': true,
        'redis.url': 'redis://localhost:6379',
      }) as never,
    );

    await adapter.connectToRedis();

    expect(mockRedisClients).toHaveLength(2);
    expect((mockRedisClients[0].options as unknown[])[1]).toEqual({
      connectTimeout: 5000,
      maxRetriesPerRequest: 3,
    });
    expect(mockRedisClients[0].listenerCount('error')).toBe(1);
    expect(mockRedisClients[1].listenerCount('error')).toBe(1);
    expect(adapter.isRedisAdapterEnabled()).toBe(true);
  });

  it('fails open when startup ping fails', async () => {
    const adapter = new RedisIoAdapter(
      {} as never,
      config({
        'redis.enabled': true,
        'redis.url': 'redis://secret-user:secret-pass@localhost:6379',
      }) as never,
    );

    mockPingShouldFail = true;
    await expect(adapter.connectToRedis()).resolves.toBeUndefined();

    expect(adapter.isRedisAdapterEnabled()).toBe(false);
    expect(adapter.isDegraded()).toBe(true);
    expect(mockRedisClients[0].disconnect).toHaveBeenCalled();
    expect(mockRedisClients[1].disconnect).toHaveBeenCalled();
  });

  it('fails open when adapter creation fails', async () => {
    mockCreateAdapter.mockImplementationOnce(() => {
      throw new Error('adapter initialization failed');
    });
    const adapter = new RedisIoAdapter(
      {} as never,
      config({
        'redis.enabled': true,
        'redis.url': 'redis://localhost:6379',
      }) as never,
    );

    await expect(adapter.connectToRedis()).resolves.toBeUndefined();
    expect(adapter.isRedisAdapterEnabled()).toBe(false);
    expect(adapter.isDegraded()).toBe(true);
  });

  it('switches registered servers to in-memory on Redis errors', async () => {
    const adapter = new RedisIoAdapter(
      {} as never,
      config({
        'redis.enabled': true,
        'redis.url': 'redis://localhost:6379',
      }) as never,
    );
    await adapter.connectToRedis();
    const server = { adapter: jest.fn(), _nsps: new Map() };
    (adapter as unknown as { servers: Set<unknown> }).servers.add(server);

    mockRedisClients[0].emit('error', new Error('connection lost'));
    mockRedisClients[1].emit('error', new Error('connection lost'));
    await new Promise((resolve) => setImmediate(resolve));

    expect(server.adapter).toHaveBeenCalledWith(Adapter);
    expect(server.adapter).toHaveBeenCalledTimes(1);
    expect(adapter.isRedisAdapterEnabled()).toBe(false);
    expect(adapter.isDegraded()).toBe(true);
  });

  it('closes both clients safely when close is called repeatedly', async () => {
    const adapter = new RedisIoAdapter(
      {} as never,
      config({
        'redis.enabled': true,
        'redis.url': 'redis://localhost:6379',
      }) as never,
    );
    await adapter.connectToRedis();

    await expect(adapter.close()).resolves.toBeUndefined();
    await expect(adapter.close()).resolves.toBeUndefined();
    expect(mockRedisClients[0].disconnect).toHaveBeenCalledTimes(1);
    expect(mockRedisClients[1].disconnect).toHaveBeenCalledTimes(1);
  });
});
