# Implementation Plan

## Product Layer

- Deploy target la Docker demo cho HomeServe/HomeService, dung DB hien co.
- Demo can pass customer/provider/admin/chatbot/report/performance smoke.
- Khong them feature moi truoc deploy; chi deploy readiness, config, docs, verification.

## System Layer

- Backend NestJS monolith dung Prisma ORM, PostgreSQL/pgvector, Redis/BullMQ trong Docker.
- Web Next.js App Router dung BFF `/api/*`; `BACKEND_URL` server-only; `NEXT_PUBLIC_WS_URL` cho websocket truc tiep.
- Backend Docker chay `prisma migrate deploy` truoc `node dist/src/main`.
- Migration hien tai them chatbot session tables; DB hien co can backup va kiem tra migration status truoc deploy.

## Delivery Layer

- Tao env examples an toan cho backend Docker va web.
- Them deploy runbook, checklist, git cleanup review theo rule khong xoa neu chua xac nhan.
- Automated gates backend/web/mobile, Docker smoke, va k6 smoke/load da pass tren Docker local.
- Ghi ket qua vao `walkthrough.md`; cleanup casing `Fe/` van cho user xac nhan truoc khi stage/xoa.

Skill da dung: homeservicerules
