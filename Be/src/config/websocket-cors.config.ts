export function resolveWebsocketCorsOrigin() {
  const origins = (
    process.env.CORS_ORIGINS ||
    process.env.FRONTEND_URL ||
    'http://localhost:3000'
  )
    .split(',')
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

  return origins.length === 1 ? origins[0] : origins;
}
