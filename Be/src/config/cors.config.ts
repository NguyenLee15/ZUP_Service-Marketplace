export type CorsRuntimeConfig = {
  origins: string[];
  credentials: boolean;
  allowedHeaders: string[];
};

const DEFAULT_DEV_ORIGIN = 'http://localhost:3000';

export function parseCorsOrigins(
  value: string | undefined,
  nodeEnv = 'development',
): string[] {
  const origins = value
    ?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map((origin) => {
      if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
        return origin.includes('localhost') || origin.includes('127.0.0.1')
          ? `http://${origin}`
          : `https://${origin}`;
      }
      return origin;
    });

  if (origins && origins.length > 0) return origins;
  return nodeEnv === 'production' ? [] : [DEFAULT_DEV_ORIGIN];
}

export function parseCorsAllowedHeaders(value: string | undefined): string[] {
  const configured = value
    ?.split(',')
    .map((header) => header.trim())
    .filter(Boolean);

  if (configured && configured.length > 0) return configured;
  return ['Content-Type', 'Authorization', 'x-request-id'];
}

export function parseBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) return fallback;
  return ['true', '1', 'yes'].includes(value.trim().toLowerCase());
}
