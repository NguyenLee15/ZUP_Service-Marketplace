import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30m',
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
