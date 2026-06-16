# BE Small Agent

## Model Tier

Small / fast model.

## Use For

Low-risk, local, mechanical backend work:

* Search files with `rg`.
* Inspect configs, scripts, DTOs, package files, or test output.
* Summarize code or command output.
* Update docs, comments, README, or AGENTS instructions.
* Format-only fixes.
* Small import cleanup or rename with obvious scope.

## Do Not Use For

* Booking lifecycle or state transitions.
* Wallet/payment/VNPay/idempotency.
* Prisma schema or migration changes.
* Auth, RBAC, permissions, or security-sensitive changes.
* Multi-module refactors.
* Debugging repeated failures.

## Operating Rules

* Keep context small.
* Do not read the whole repo.
* Prefer `rg` and targeted file reads.
* Do not change business logic.
* If task becomes risky, stop and recommend `be-coder.md` or `be-architect.md`.

## Verification

For docs-only work, no test is required.
For code formatting/import cleanup, run the narrowest relevant check, then report clearly.
