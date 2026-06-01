import {
  parseBoolean,
  parseCorsAllowedHeaders,
  parseCorsOrigins,
} from './cors.config';

describe('CORS config parser', () => {
  it('parses comma-separated origins with trimming and empty filtering', () => {
    expect(
      parseCorsOrigins(' https://web.test, ,https://mobile.test '),
    ).toEqual(['https://web.test', 'https://mobile.test']);
  });

  it('falls back to localhost in non-production only', () => {
    expect(parseCorsOrigins(undefined, 'development')).toEqual([
      'http://localhost:3000',
    ]);
    expect(parseCorsOrigins(undefined, 'production')).toEqual([]);
  });

  it('includes x-request-id in default allowed headers', () => {
    expect(parseCorsAllowedHeaders(undefined)).toEqual([
      'Content-Type',
      'Authorization',
      'x-request-id',
    ]);
  });

  it('parses boolean flags with a fallback', () => {
    expect(parseBoolean(undefined, true)).toBe(true);
    expect(parseBoolean('false', true)).toBe(false);
    expect(parseBoolean('yes', false)).toBe(true);
  });
});
