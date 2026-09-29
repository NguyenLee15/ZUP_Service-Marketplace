# Service Marketplace Context

## Domain vocabulary

- **Customer** creates and manages a **Booking** for an active **Service**.
- **Provider** owns services, receives bookings, submits quotations, and operates a **ProviderWallet**.
- A booking lifecycle is represented by `BookingStatus`: `PENDING`, `ACCEPTED`, `QUOTED`, `CONFIRMED`, `IN_PROGRESS`, `DONE`, `DISPUTED`, or `CANCELLED`.
- Reviews are public only when `isFlagged = false`; public aggregates must use that same predicate.
- Auth refresh and password-reset values are persisted as hashes. OTP verification uses `codeHash`; the legacy raw OTP column remains only during the expand-contract migration phase.
- Redis is infrastructure for cache, tracking, and queues. PostgreSQL is authoritative for transactional correctness and idempotency.

## Trust boundaries

- DTO validation is the request boundary; services enforce ownership, state transitions, and server-side business rules.
- External storage and provider APIs stay outside Prisma transactions.
- Auth cookies are BFF-managed, HttpOnly, Secure in production, and SameSite Strict.
- Production does not use demo accounts or mock tokens; local development may expose the existing demo drawer.

## Verification conventions

- Backend verification: `npm.cmd test -- --runInBand`, `npm.cmd run typecheck`, `npm.cmd run build`, `npm.cmd run lint`.
- Web verification: `npm.cmd run build`, `npm.cmd run lint`.
- Integration tests require a disposable `DATABASE_URL_TEST`; managed database hosts are rejected by the migration script.
