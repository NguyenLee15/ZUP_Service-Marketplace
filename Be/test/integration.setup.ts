const databaseUrlTest = process.env.DATABASE_URL_TEST;

if (!databaseUrlTest) {
  throw new Error(
    'DATABASE_URL_TEST is required for integration tests. Start a disposable PostgreSQL DB with npm run db:test:up, set DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5433/service_marketplace_test?schema=public, run npm run db:test:migrate, then run npm run test:integration.',
  );
}

process.env.DATABASE_URL = databaseUrlTest;
process.env.DIRECT_URL = databaseUrlTest;
process.env.RUNTIME_PROFILE = 'local';
process.env.REDIS_ENABLED = 'false';
process.env.QUEUE_MODE = 'inline';
process.env.WORKER_ENABLED = 'false';
process.env.CRON_ENABLED = 'false';
process.env.MAIL_PROVIDER = 'console';
