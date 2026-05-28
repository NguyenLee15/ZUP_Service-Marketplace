const databaseUrlTest = process.env.DATABASE_URL_TEST;

if (!databaseUrlTest) {
  throw new Error(
    'DATABASE_URL_TEST is required for integration tests. Point it to a disposable PostgreSQL test database, run migrations, then run npm run test:integration.',
  );
}

process.env.DATABASE_URL = databaseUrlTest;
process.env.RUNTIME_PROFILE = 'local';
process.env.REDIS_ENABLED = 'false';
process.env.QUEUE_MODE = 'inline';
process.env.WORKER_ENABLED = 'false';
process.env.CRON_ENABLED = 'false';
process.env.MAIL_PROVIDER = 'console';
