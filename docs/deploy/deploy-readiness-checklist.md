# Deploy Readiness Checklist

## Must Pass

- [ ] `git status --short` duoc review; khong co secret/build output can commit.
- [ ] User xac nhan cleanup `Fe/` truoc khi xoa/stage.
- [ ] `Be/.env` tao tu `.env.docker.example`, khong commit.
- [ ] `fe/wed/.env.local` tao tu `.env.example`, khong commit.
- [ ] DB backup xong truoc khi migration.
- [x] `npx prisma validate` pass.
- [x] `npm run build`, `npm test -- --runInBand`, `npm run test:e2e`, `npm run lint` pass trong `Be`.
- [x] `npm run build`, `npm run lint` pass trong `fe/wed`.
- [x] `npx tsc --noEmit` pass trong `fe/mobile`.
- [x] `docker compose config --quiet` pass.
- [x] `docker compose build backend frontend` pass.
- [x] `docker compose up -d postgres redis backend frontend` pass.
- [x] `http://localhost:3001/health` status ok.
- [x] `http://localhost:3000` render duoc.
- [x] Backend logs khong co loi migration/Prisma/Redis sau khi override local Redis.

## Manual Smoke

- [ ] Auth: register/login/refresh/logout.
- [ ] Locked user khong thuc hien duoc write action.
- [ ] Customer: service list/detail/search.
- [ ] Customer: create booking va follow booking state machine.
- [ ] Chatbot: public advice, logged-in draft booking, confirm action moi tao booking.
- [ ] Provider mobile: receive booking, send quote, start, done.
- [ ] Chat/realtime: service-level, booking-level, notification websocket.
- [ ] Admin: dashboard, KYC, dispute, PDF/Excel export.
- [ ] VNPay sandbox neu demo wallet: duplicate callback khong double-credit.
- [x] k6 smoke pass.
- [x] k6 100 VUs pass p95 < 1s, error < 1% (`p95=817.030738ms`, error rate `0`).

Skill da dung: homeservicerules
