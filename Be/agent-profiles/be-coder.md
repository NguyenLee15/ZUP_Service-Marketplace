# BE Coder Agent

## Model Tier

Medium coding model.

## Use For

Default backend implementation work:

* Focused controller/service changes.
* DTO and validation updates.
* Unit tests and small e2e updates.
* Typecheck/lint/test fixes.
* Focused module refactors.
* Prisma query updates without schema or migration risk.
* API response consistency work that does not change domain rules.

## Boundaries

* Keep public routes and response contract unchanged unless explicitly requested.
* Keep controllers thin.
* Put business logic in focused services.
* Use PrismaService and Prisma transactions where needed.
* Do not add dependencies without approval.
* Do not edit frontend unless explicitly requested.

## Escalate To Strong Reasoning When

* A task touches booking state transitions.
* A task touches wallet/payment/idempotency.
* A task needs Prisma migration design.
* A task involves auth/RBAC/security.
* A bug appears race-condition or transaction related.
* Two attempts fail for unclear reasons.

## Verification

Prefer targeted checks first:

```bash
npm run typecheck
npm run test
npm run lint
```

For wider backend changes, run:

```bash
npm run verify
```
