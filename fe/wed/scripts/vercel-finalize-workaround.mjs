import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const appNextDir = resolve(appDir, '.next');
const routesManifest = resolve(appNextDir, 'routes-manifest.json');
const deterministicRoutesManifest = resolve(appNextDir, 'routes-manifest-deterministic.json');

const manifestFiles = [
  'routes-manifest.json',
  'routes-manifest-deterministic.json',
  'app-path-routes-manifest.json',
  'build-manifest.json',
  'fallback-build-manifest.json',
  'images-manifest.json',
  'prerender-manifest.json',
  'required-server-files.json',
  'server/app-paths-manifest.json',
  'server/functions-config-manifest.json',
  'server/middleware-manifest.json',
  'server/next-font-manifest.json',
  'server/pages-manifest.json',
  'server/server-reference-manifest.json',
];

function copyManifestIfExists(relativePath, targetNextDir) {
  const source = resolve(appNextDir, relativePath);
  if (!existsSync(source)) {
    return;
  }

  const target = resolve(targetNextDir, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
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

  mkdirSync(rootNextDir, { recursive: true });
  for (const manifestFile of manifestFiles) {
    copyManifestIfExists(manifestFile, rootNextDir);
  }
}
