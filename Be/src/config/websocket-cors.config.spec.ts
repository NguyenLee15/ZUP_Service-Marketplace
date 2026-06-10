import { resolveWebsocketCorsOrigin } from './websocket-cors.config';

describe('WebSocket CORS config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.CORS_ORIGINS;
    delete process.env.FRONTEND_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('prefers CORS_ORIGINS over FRONTEND_URL', () => {
    process.env.CORS_ORIGINS = 'https://web.test';
    process.env.FRONTEND_URL = 'https://old-web.test';

    expect(resolveWebsocketCorsOrigin()).toBe('https://web.test');
  });

  it('returns an array when multiple origins are configured', () => {
    process.env.CORS_ORIGINS = 'https://web.test, https://admin.test';

    expect(resolveWebsocketCorsOrigin()).toEqual([
      'https://web.test',
      'https://admin.test',
    ]);
  });

  it('falls back to local frontend origin', () => {
    expect(resolveWebsocketCorsOrigin()).toBe('http://localhost:3000');
  });
});
