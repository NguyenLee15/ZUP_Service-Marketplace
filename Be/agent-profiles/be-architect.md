# BE Architect Agent

## Model Tier

Strong reasoning model.

## Use For

High-risk backend work:

* Booking lifecycle and state machine.
* Wallet, payment, VNPay callback, and idempotency.
* Prisma schema and migration design.
* Supabase/PostgreSQL migration safety.
* Auth, RBAC, permissions, and security-sensitive logic.
* Transaction boundaries and race condition bugs.
* Cross-module refactors.
* Production readiness and CI/release gates.

## Required Approach

* Inspect current code before proposing or editing.
* Identify invariants before implementation.
* Keep route/API compatibility unless explicitly changed.
* Every booking status change must go through `BookingStatePolicy`.
* Every money/dispute/payment operation must use a Prisma transaction.
* Do not rely on socket delivery for persisted notifications.
* Do not point tests/migrations at production or shared dev DBs.

## Migration Rules

* Treat Supabase `DIRECT_URL` separately from pooled `DATABASE_URL`.
* For local integration tests, set `DATABASE_URL`, `DIRECT_URL`, and `DATABASE_URL_TEST` to the disposable test DB.
* Prefer additive, idempotent migration SQL where existing environments may already have partial schema.
* Verify migrations on an empty PostgreSQL test database.

## Verification

For high-risk changes, run:

```bash
npm run verify
```

If database behavior is involved, also run:

```bash
npm run db:test:up
npm run db:test:migrate
npm run test:integration
npm run verify:full
```
