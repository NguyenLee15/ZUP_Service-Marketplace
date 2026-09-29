import { getQueueMode } from './runtime.config';

describe('production runtime configuration', () => {
  const original = {
    profile: process.env.RUNTIME_PROFILE,
    redis: process.env.REDIS_ENABLED,
    queue: process.env.QUEUE_MODE,
  };

  afterEach(() => {
    process.env.RUNTIME_PROFILE = original.profile;
    process.env.REDIS_ENABLED = original.redis;
    process.env.QUEUE_MODE = original.queue;
  });

  it('rejects production inline queues', () => {
    process.env.RUNTIME_PROFILE = 'prod';
    process.env.REDIS_ENABLED = 'false';
    process.env.QUEUE_MODE = 'inline';

    expect(() => getQueueMode()).toThrow(/Redis.*queue/i);
  });
});
