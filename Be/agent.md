# agent.md

## Backend Engineering Standards (NestJS)

### Architecture

- Thin Controllers, business logic only in Services.
- PrismaService for data access.
- DTO + ValidationPipe for all inputs.
- Global Exception Filter/Handler.
- Follow SOLID principles.
- Single Responsibility per module/service.
- Prefer composition over inheritance.
- Keep module boundaries clear.
- No business logic in Controllers, Guards, or Repositories.

### Design Patterns

Use patterns when they reduce real complexity. Do not introduce abstractions only to satisfy a pattern name.

- Strategy Pattern for pricing, commissions, discounts, AI ranking, and business rules when variation grows.
- Factory Pattern for payment providers, notification providers, and AI providers when multiple providers are active.
- Facade Pattern only as a thin compatibility layer for complex workflows; prefer focused use-case services.
- Adapter Pattern for third-party integrations (VNPay, Cloudinary, Gemini, OpenAI).
- Observer/Event-Driven Pattern for notifications, audit logs, analytics, and async side effects.
- Use Prisma query APIs for dynamic search and filtering.
- Avoid large if/else and switch chains when Strategy or Factory is applicable.
- Avoid manual Singleton implementations; rely on NestJS DI container.

### Security

- JWT Authentication.
- Refresh Token rotation and session management.
- RBAC (Admin, Staff, Provider, Customer).
- Protect all sensitive endpoints.
- Validate ownership and permissions.
- Input validation on every public endpoint.
- Never trust client-side data.
- Secrets must come from environment variables.

### Reliability

- Booking State Machine with valid transitions only.
- Payment Idempotency for VNPay callbacks; future payment providers must follow the same contract.
- Audit Log for critical actions.
- Database transactions for critical business flows.
- Prevent duplicate bookings and duplicate payments.
- Handle retries safely.

### Testing

- Unit Tests for Auth, Booking, Payment, Dispute, and KYC services.
- API/Integration Tests for critical workflows.
- Security Tests (401, 403, role restrictions).
- Cover success, failure, and edge cases.
- Mock external services and third-party providers.

### API Standards

- Swagger/OpenAPI documentation.
- Consistent response format.
- Consistent error format.
- Pagination, filtering, sorting where applicable.
- Version APIs when necessary.
- Clear DTOs for requests and responses.
- Do not change public routes or response shapes unless the user explicitly approves FE-breaking changes.
- When API contract changes are approved, update shared DTOs, Swagger docs, tests, and FE-facing notes together.

### Code Quality

- Clear naming conventions.
- No duplicated business logic.
- No magic numbers or hardcoded values.
- Environment variables for configuration.
- Prefer enums over string literals.
- Keep methods small and focused.
- Write self-documenting code.

### Production Readiness

- Structured logging.
- Health checks.
- Rate limiting.
- Database migrations.
- Monitoring and error tracking.
- Comprehensive README and architecture documentation.
- Supabase runtime should use the pooled `DATABASE_URL`.
- Prisma migrations should use `DIRECT_URL`.
- Integration tests must use a disposable local PostgreSQL database through `DATABASE_URL_TEST`.
- Never run integration tests or migrations against a real Supabase production database by default.

### Marketplace Rules

- KYC approval required before publishing services.
- Provider ownership validation on all provider resources.
- Booking lifecycle must follow defined state transitions.
- Payment lifecycle must be traceable and auditable.
- All financial operations require audit logs.
- All status changes must be recorded.

### Commands

```bash
npx prisma validate
npx prisma generate
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
npm run verify
```

### Integration Test Commands

Use these only with a disposable local PostgreSQL database:

```bash
npm run db:test:up
npm run db:test:migrate
npm run test:integration
npm run verify:full
```

On PowerShell, set the test database URL before running integration tests:

```powershell
$env:DATABASE_URL_TEST='postgresql://postgres:postgres@localhost:5433/service_marketplace_test?schema=public'
```

### Rules For AI Agents

- Do not add new dependencies without approval.
- Do not bypass validation.
- Do not bypass guards or RBAC.
- Do not place business logic inside controllers.
- Do not hardcode secrets, URLs, or credentials.
- Always update DTOs, Swagger docs, and tests when modifying APIs.
- When adding admin permissions, update `AdminPermission` metadata, Swagger docs, and e2e 403 coverage together.
- When adding or changing sensitive routes, update `Be/docs/security-route-matrix.md` and add or adjust 401/403 e2e coverage.
- When changing auth, session, or token storage, add replay/reuse tests and do not store new raw refresh/reset tokens.
- Prefer small focused changes over large rewrites.
- Maintain backward compatibility unless explicitly requested.
- Do not touch FE files when the requested scope is backend-only.
- Do not revert dirty worktree changes made by the user or another agent.
- Read environment variables in config/bootstrap/test setup only; business modules should use `ConfigService`.
- Before claiming completion, run `npm run verify`; if the task touches DB integration behavior, also run `npm run verify:full` with `DATABASE_URL_TEST`.
- If Docker or the test DB is unavailable, report the blocker clearly instead of using a dev or production database.

### Model Routing Policy

Use the smallest capable model for each task.

This file is a routing policy, not an automatic model switcher by itself. If the AI tool supports automatic routing, apply these rules automatically. If it does not, select the model/profile manually.

#### Small / Fast Model

Use for low-risk, local, mechanical tasks:

- Search files and summarize code.
- Inspect configs, scripts, DTOs, or test output.
- Format-only fixes.
- Simple docs, comments, README, or AGENTS updates.
- Small rename or import cleanup with clear scope.
- Run commands and summarize output.

Do not use for business logic, migrations, auth, payment, booking state, or security-sensitive changes.

#### Medium Coding Model

Use for normal backend implementation:

- Add or update focused controller/service methods.
- Write or update unit tests.
- Refactor one module with clear boundaries.
- Fix typecheck, lint, or test failures.
- Update Prisma queries without schema or transaction risk.
- Improve API response consistency without changing domain behavior.

This is the default for most backend work.

#### Strong Reasoning Model

Use only for high-risk or wide-context tasks:

- Booking lifecycle and state machine changes.
- Wallet, payment, VNPay callback, and idempotency logic.
- Prisma schema and migration design.
- Auth, RBAC, permission, and security-sensitive changes.
- Race condition, transaction, or data consistency bugs.
- Large refactors across modules.
- Debugging after repeated failed attempts.
- Architecture review and production-readiness decisions.

#### Research / Latest Docs Model

Use when current external facts matter:

- Prisma, NestJS, Supabase, VNPay, OpenAI, or deployment platform behavior.
- Security advisories.
- Provider-specific integration behavior.

Prefer official documentation and cite sources when decisions depend on external docs.

#### Context Budget Rules

- Never send the whole repo unless necessary.
- Prefer targeted files, diffs, test output, and `rg` results.
- For large refactors, split work into vertical slices:
  1. inspect
  2. edit focused module
  3. run targeted tests
  4. run full gate
- Summarize old context before switching tasks.
- Escalate to a stronger model only when reasoning risk requires it, not because the task is long.

#### Backend Defaults

- Small model: docs, formatting, command summaries, config inspection.
- Medium model: CRUD, DTO, controller/service cleanup, tests.
- Strong reasoning model: Booking, Wallet, Payment, Prisma migrations, Auth/RBAC, Supabase safety, CI/release gates.

### Agent Profiles

Reusable backend agent profiles live in `Be/agent-profiles/`:

- `be-small.md` — use with a small/fast model for low-risk inspection, docs, formatting, and summaries.
- `be-coder.md` — use with a medium coding model for normal backend implementation.
- `be-architect.md` — use with a strong reasoning model for Booking, Wallet, Payment, Prisma migrations, Auth/RBAC, and production gates.
- `be-research.md` — use with a research-capable model for current external docs and provider behavior.

If the AI tool does not support automatic routing, select the matching model manually and use the relevant profile as the agent/system prompt.
