# Supabase Runtime And Local Integration Tests

## Production/Supabase

- `DATABASE_URL`: Supabase transaction pooler URL used by the NestJS app at runtime.
- `DIRECT_URL`: Supabase direct connection URL used only by Prisma schema and migration commands.
- Do not run `npm run db:test:migrate` against Supabase. The script refuses managed hosts when they are passed through `DATABASE_URL_TEST`.

## Local Integration Database

Use a disposable PostgreSQL database for integration tests:

```powershell
npm run db:test:up
$env:DATABASE_URL_TEST='postgresql://postgres:postgres@localhost:5433/service_marketplace_test?schema=public'
npm run db:test:migrate
npm run test:integration
```

`db:test:migrate` copies `DATABASE_URL_TEST` into both `DATABASE_URL` and `DIRECT_URL` for the Prisma process, so Prisma never needs the Supabase URLs during integration tests.

> Staging/production safety: do not point `DATABASE_URL_TEST` at Supabase. Use local/CI disposable PostgreSQL only.
