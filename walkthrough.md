# Walkthrough

## 2026-05-16 Deploy Readiness

### Completed

- Added deploy-focused docs under `docs/deploy`.
- Added safe backend/web env examples for Docker demo and Gemini AI config.
- Updated Docker compose to override runtime profile and enable Redis/BullMQ worker mode for demo.
- Updated root `.gitignore` so local env, build output, tsbuildinfo, and generated perf reports are not staged accidentally.
- Preserved `Fe/` cleanup as review-only because project rules require explicit confirmation before delete/remove.
- Verified backend gates: `npx prisma validate`, `npm run build`, `npm test -- --runInBand`, `npm run test:e2e`, and `npm run lint` pass.
- Verified web gates: `npm run build`, `npm run lint`, and `.next/standalone` exists.
- Verified mobile gate: `npx tsc --noEmit` passes.
- Verified Docker demo: compose config/build/up pass; backend health returns 200; web returns 200; backend uses local Redis service after overriding `REDIS_URL`.
- Verified k6: smoke pass; `load-100vus` pass with p95 `817.030738ms`, error rate `0`, checks `33844/33844`.

### Technical Debt

- Prisma migrations currently are not a full historical baseline. For an existing DB, run backup and migration status/resolve workflow before deploying. For a brand-new DB, create or apply a proper baseline first.
- Lint still reports warning-level type-safety debt across backend/web. It does not block demo deploy but should be handled after stabilization.
- Generated k6 reports are present in `reports/perf`, but `.gitignore` now keeps generated HTML/JSON out of normal commits.

### Product Debt

- Generated performance reports should be kept only as final demo evidence, not as routine source files.
- Provider production deploy path for mobile still needs EAS/release planning; current target remains Docker demo for web/backend.

Skill da dung: homeservicerules
