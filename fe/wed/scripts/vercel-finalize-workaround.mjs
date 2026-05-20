import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appNextDir = resolve(appDir, '.next');
const routesManifest = resolve(appNextDir, 'routes-manifest.json');
const deterministicRoutesManifest = resolve(appNextDir, 'routes-manifest-deterministic.json');

if (!existsSync(routesManifest)) {
  console.warn('[vercel-finalize-workaround] .next/routes-manifest.json not found; skipping.');
  process.exit(0);
}

if (!existsSync(deterministicRoutesManifest)) {
  copyFileSync(routesManifest, deterministicRoutesManifest);
}

if (process.env.VERCEL === '1') {
  const repoRoot = resolve(appDir, '..', '..');
  const rootNextDir = resolve(repoRoot, '.next');

  mkdirSync(rootNextDir, { recursive: true });
  copyFileSync(routesManifest, resolve(rootNextDir, 'routes-manifest.json'));
  copyFileSync(deterministicRoutesManifest, resolve(rootNextDir, 'routes-manifest-deterministic.json'));
}
