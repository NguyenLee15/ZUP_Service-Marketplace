import { registerAs } from '@nestjs/config';

function getSecret(name: string, developmentFallback: string) {
  const value = process.env[name];
  if (value) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${name} is required in production`);
  }

  return developmentFallback;
}

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: getSecret('JWT_SECRET', 'development-jwt-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30m',
  jwtRefreshSecret: getSecret(
    'JWT_REFRESH_SECRET',
    'development-refresh-secret-change-me',
  ),
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
