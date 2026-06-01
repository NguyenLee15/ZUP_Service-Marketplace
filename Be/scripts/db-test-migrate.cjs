const { spawnSync } = require('node:child_process');

const databaseUrlTest = process.env.DATABASE_URL_TEST;

if (!databaseUrlTest) {
  console.error(
    'DATABASE_URL_TEST is required. Example: postgresql://postgres:postgres@localhost:5433/service_marketplace_test?schema=public',
  );
  process.exit(1);
}

const forbiddenHosts = ['supabase.com', 'neon.tech'];
if (forbiddenHosts.some((host) => databaseUrlTest.includes(host))) {
  console.error(
    'Refusing to run test migrations against a managed database host. DATABASE_URL_TEST must point to a disposable local/CI PostgreSQL database.',
  );
  process.exit(1);
}

const env = {
  ...process.env,
  DATABASE_URL: databaseUrlTest,
  DIRECT_URL: databaseUrlTest,
};

const result = spawnSync(
  'npx',
  ['prisma', 'migrate', 'deploy'],
  {
    stdio: 'inherit',
    env,
    shell: process.platform === 'win32',
  },
);

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
