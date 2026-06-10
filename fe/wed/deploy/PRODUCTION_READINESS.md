# Production Readiness Checklist

Muc tieu release nay: frontend Vercel, backend Render Singapore, VNPay sandbox co nhan ro, PWA/offline chua bat.

## Frontend Vercel env

- `NEXT_PUBLIC_APP_URL`: domain frontend that nguoi dung se mo, vi du `https://your-app.vercel.app`.
- `BACKEND_URL`: origin backend Render, khong co path sau domain, vi du `https://your-api.onrender.com`.
- `NEXT_PUBLIC_WS_URL`: cung origin backend public de browser ket noi socket.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: OAuth client da khai bao dung JavaScript origin la `NEXT_PUBLIC_APP_URL`.
- `GEMINI_API_KEY` hoac `GOOGLE_GENERATIVE_AI_API_KEY`: chi cau hinh tren server env, khong dung prefix `NEXT_PUBLIC_`.

## Backend Render env

- `FRONTEND_URL`: bang dung `NEXT_PUBLIC_APP_URL`.
- `CORS_ORIGINS`: chi chua cac frontend origin duoc phep, ngan cach bang dau phay neu co nhieu domain.
- `DATABASE_URL`: production database, khong dung demo/local.
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, cookie/session secret: gia tri random manh, khac local.
- `VNPAY_URL`: sandbox URL cua VNPay trong release nay.
- `VNPAY_RETURN_URL` va `VNPAY_IPN_URL`: tro ve backend/frontend deploy domain that, dung HTTPS.
- `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`: sandbox credential, khong dung credential thu tien that.

## Policy UI

- Thanh toan phai hien ro `VNPay Sandbox` hoac `Thanh toan thu nghiem`.
- PWA/offline dang tat: khong quang ba cai dat app/offline-first; `sw.js` chi de don cache cu.
- Dat lich va dia chi khong duoc tu dien toa do/dia chi gia. Neu khong co reverse geocoding that thi bat nguoi dung nhap dia chi thu cong.

## Smoke before deploy

- Frontend: `npm run lint`, `npm run build` trong `fe/wed`.
- Backend: `npm run typecheck`, `npm run build`, va test/smoke phu hop trong `Be`.
- Manual guest: home -> services -> service detail -> login/register/forgot password.
- Manual customer: create booking -> detail -> cancel/rebook/review/dispute -> chat -> notifications -> profile/address.
- Manual admin: dashboard -> users lock/unlock -> services -> bookings cancel -> KYC -> disputes -> wallet/settings/audit logs.
- Responsive: `390x844`, `768x1024`, `1440x900`.
- Keyboard: header, filters, booking wizard, dialogs, rating, admin table actions.

## Smoke after deploy

- `/health` va `/health/ready` cua backend tra thanh cong.
- Dang nhap, refresh cookie, vao protected route.
- Tao booking sandbox voi gio dia phuong dung mui gio Viet Nam.
- Socket notification/chat ket noi qua `NEXT_PUBLIC_WS_URL`.
- Admin lock/unlock va cancel dialog co focus trap, Escape close, ly do bat buoc.
- VNPay redirect/callback/IPN chay sandbox va moi copy thanh toan van noi ro thu nghiem.
