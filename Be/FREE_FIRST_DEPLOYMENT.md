# Free-first backend setup

## Local dev

1. Copy env:

```bash
cp .env.example .env
```

2. Use the free/local runtime defaults:

```env
RUNTIME_PROFILE=local
REDIS_ENABLED=false
QUEUE_MODE=inline
WORKER_ENABLED=false
CRON_ENABLED=false
MAIL_PROVIDER=console
```

3. Sync Prisma schema to your dev database:

```bash
npx prisma db push
npx prisma generate
```

4. Run backend:

```bash
npm run start:dev
```

`/health/ready` should show `queueMode: "inline"` and Redis as `skipped`.

## Free public demo

Recommended free stack:

- Backend: Render Free web service
- Database: Neon Free Postgres pooled connection string
- Redis: disabled
- Email: Brevo Free API
- Uploads: Cloudinary or another external storage provider

Use `.env.free.example` as the Render env checklist. Important values:

```env
RUNTIME_PROFILE=free
REDIS_ENABLED=false
QUEUE_MODE=inline
WORKER_ENABLED=false
CRON_ENABLED=false
MAIL_PROVIDER=brevo
BREVO_API_KEY=...
DATABASE_URL=...neon...pgbouncer=true
```

After deploying, point the mobile app to Render:

```env
EXPO_PUBLIC_API_URL=https://your-render-backend.onrender.com
```

Restart Expo after changing `.env`.

## Paid production upgrade

Use `.env.prod.example` and split services:

- API service: `WORKER_ENABLED=false`, `CRON_ENABLED=false`
- Worker service: `WORKER_ENABLED=true`, `CRON_ENABLED=true`
- Both services: `REDIS_ENABLED=true`, `QUEUE_MODE=redis`

This keeps the free demo path cheap while preserving the BullMQ worker path for real production.
