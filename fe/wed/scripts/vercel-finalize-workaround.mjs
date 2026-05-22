import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, symlinkSync } from 'node:fs';
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

function copyDirectoryIfExists(sourceDir, targetDir) {
  if (!existsSync(sourceDir)) {
    return;
  }

  mkdirSync(dirname(targetDir), { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true, force: true });
}

function linkDirectoryIfMissing(sourceDir, targetDir) {
  if (existsSync(targetDir)) {
    return;
  }

  mkdirSync(dirname(targetDir), { recursive: true });
  symlinkSync(sourceDir, targetDir, 'dir');
}

function linkNodeModulesForRootTrace(repoRoot) {
  const appNodeModules = resolve(appDir, 'node_modules');
  const rootNodeModules = resolve(repoRoot, 'node_modules');

  if (!existsSync(appNodeModules)) {
    return;
  }

  if (!existsSync(rootNodeModules)) {
    linkDirectoryIfMissing(appNodeModules, rootNodeModules);
    return;
  }

  for (const entry of readdirSync(appNodeModules, { withFileTypes: true })) {
    if (entry.name === '.bin' || !entry.isDirectory()) {
      continue;
    }

    const appEntry = resolve(appNodeModules, entry.name);
    const rootEntry = resolve(rootNodeModules, entry.name);

    if (!entry.name.startsWith('@')) {
      linkDirectoryIfMissing(appEntry, rootEntry);
      continue;
    }

    mkdirSync(rootEntry, { recursive: true });
    for (const scopedEntry of readdirSync(appEntry, { withFileTypes: true })) {
      if (!scopedEntry.isDirectory()) {
        continue;
      }

      linkDirectoryIfMissing(resolve(appEntry, scopedEntry.name), resolve(rootEntry, scopedEntry.name));
    }
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
  copyDirectoryIfExists(resolve(appNextDir, 'server'), resolve(rootNextDir, 'server'));
  copyDirectoryIfExists(resolve(appNextDir, 'static'), resolve(rootNextDir, 'static'));
  linkNodeModulesForRootTrace(repoRoot);
}
