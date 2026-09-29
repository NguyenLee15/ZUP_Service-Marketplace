import appConfig from './app.config';

describe('app configuration secrets', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.JWT_REFRESH_SECRET = originalRefreshSecret;
  });

  it('fails closed in production when a JWT secret is too short', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'short';
    process.env.JWT_REFRESH_SECRET =
      'refresh-secret-with-at-least-32-characters';

    expect(() => appConfig()).toThrow(/JWT_SECRET/);
  });

  it('bounds trusted proxy hops instead of trusting arbitrary forwarded clients', () => {
    process.env.NODE_ENV = 'test';
    process.env.TRUST_PROXY_HOPS = '99';
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

    expect(appConfig().trustedProxyHops).toBe(10);
  });
});
