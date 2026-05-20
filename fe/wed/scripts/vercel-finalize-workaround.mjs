import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appNextDir = resolve(appDir, '.next');
const routesManifest = resolve(appNextDir, 'routes-manifest.json');
const deterministicRoutesManifest = resolve(appNextDir, 'routes-manifest-deterministic.json');

function copyDirectFiles(sourceDir, targetDir) {
  if (!existsSync(sourceDir)) {
    return;
  }

  mkdirSync(targetDir, { recursive: true });

  for (const entry of readdirSync(sourceDir, { withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }

    copyFileSync(resolve(sourceDir, entry.name), resolve(targetDir, entry.name));
  }
}

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

  copyDirectFiles(appNextDir, rootNextDir);
  copyDirectFiles(resolve(appNextDir, 'server'), resolve(rootNextDir, 'server'));
}
