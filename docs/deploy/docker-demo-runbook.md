# Docker Demo Deploy Runbook

Ngay deploy: demo Docker local/VPS cho HomeServe/HomeService với database hiện có.

## Constraints

- Khong xoa `Fe/` hoac file cu khi chua co xac nhan cleanup rieng.
- Khong dung `prisma db push --accept-data-loss`.
- Khong commit `.env`, `.env.local`, build output, perf report generated.
- Web client chi goi `/api/*`; BFF dung `BACKEND_URL`; WebSocket dung `NEXT_PUBLIC_WS_URL`.
- Backend Docker chay migration bang `npx prisma migrate deploy`.

## Red Team

| Risk | Failure scenario | Mitigation |
|---|---|---|
| Migration baseline | DB hien co chua co `_prisma_migrations`, `migrate deploy` co the khong biet schema hien tai | Backup DB, chay tren clone truoc, dung `prisma migrate status`; neu can baseline thi `migrate resolve` co kiem soat |
| Secret leakage | `.env` local dang co credential that bi commit/build vao image | `.dockerignore` chan `.env`; `.gitignore` chan env; rotate credential da lo |
| Runtime mismatch | Docker co Redis nhung backend ke thua `REDIS_ENABLED=false` tu `Be/.env` | `docker-compose.yml` override `RUNTIME_PROFILE=prod`, `REDIS_ENABLED=true`, `QUEUE_MODE=redis`, `WORKER_ENABLED=true` |

## Preflight

```powershell
git status --short
docker compose config --quiet
cd Be
npx prisma validate
npm run build
npm test -- --runInBand
npm run test:e2e
npm run lint
cd ..\fe\wed
npm run build
npm run lint
cd ..\mobile
npx tsc --noEmit
```

## Database Existing-DB Path

1. Backup DB hien co truoc khi deploy.
2. Chay migration tren DB clone hoac local copy truoc.
3. Kiem tra migration hien tai chi them:
   - `chatbot_sessions`
   - `chatbot_session_messages`
4. Neu DB hien co chua co migration history:
   - khong tu dong deploy vao DB that;
   - tao baseline/resolution rieng cho DB do;
   - chi chay `migrate deploy` sau khi `migrate status` khong con drift nguy hiem.

## Docker Demo

```powershell
Copy-Item Be\.env.docker.example Be\.env
# Dien cac secret can thiet trong Be\.env, toi thieu JWT_* va GEMINI_API_KEY.

docker compose build backend frontend
docker compose up -d postgres redis backend frontend
docker compose ps
docker compose logs backend --tail 120
```

Health checks:

```powershell
Invoke-WebRequest http://localhost:3001/health
Invoke-WebRequest http://localhost:3000
```

## Smoke Checklist

- Auth: register, verify OTP/resend OTP, login, refresh, logout.
- Customer: service list/detail/search, create booking, confirm/reject quote, accept, review/dispute.
- Provider mobile: receive booking, confirm surveyor, send quote, start, done.
- Chatbot: public service advice; logged-in draft booking; create only after confirm; open provider chat.
- Chat/realtime: service conversation, booking conversation, notification socket.
- Admin: users, services, categories, KYC, disputes, dashboard, PDF/Excel export.
- Wallet/VNPay sandbox: deposit idempotency, duplicate IPN not double-credit.

## Performance Evidence

```powershell
docker run --rm -i `
  --network service-marketplace_app-network `
  -e BASE_URL=http://backend:3001 `
  -v ${PWD}:/workspace `
  -w /workspace `
  grafana/k6 run tools/perf/smoke.js

docker run --rm -i `
  --network service-marketplace_app-network `
  -e BASE_URL=http://backend:3001 `
  -v ${PWD}:/workspace `
  -w /workspace `
  grafana/k6 run tools/perf/load-100vus.js
```

Pass target:

- `http_req_duration p95 < 1000ms`
- `http_req_failed < 1%`

Skill da dung: homeservicerules
