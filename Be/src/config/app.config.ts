import { registerAs } from '@nestjs/config';
import {
  parseBoolean,
  parseCorsAllowedHeaders,
  parseCorsOrigins,
} from './cors.config';

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getSecret(name: string, developmentFallback: string) {
  const value = process.env[name];
  if (value && (process.env.NODE_ENV !== 'production' || value.length >= 32)) {
    return value;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `${name} is required in production and must be at least 32 characters`,
    );
  }

  return developmentFallback;
}

export default registerAs('app', () => ({
  port: parseNumber(process.env.PORT, 3001),
  trustedProxyHops: Math.max(
    0,
    Math.min(parseNumber(process.env.TRUST_PROXY_HOPS, 1), 10),
  ),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: getSecret('JWT_SECRET', 'development-jwt-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtIssuer: process.env.JWT_ISSUER || 'service-marketplace',
  jwtAudience: process.env.JWT_AUDIENCE || 'service-marketplace-client',
  jwtRefreshSecret: getSecret(
    'JWT_REFRESH_SECRET',
    'development-refresh-secret-change-me',
  ),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  throttleTtl: parseNumber(process.env.THROTTLE_TTL, 60000),
  throttleLimit: parseNumber(process.env.THROTTLE_LIMIT, 100),
  corsOrigins: parseCorsOrigins(
    process.env.CORS_ORIGINS || process.env.FRONTEND_URL,
    process.env.NODE_ENV,
  ),
  corsCredentials: parseBoolean(process.env.CORS_CREDENTIALS, true),
  corsAllowedHeaders: parseCorsAllowedHeaders(process.env.CORS_ALLOWED_HEADERS),
}));
