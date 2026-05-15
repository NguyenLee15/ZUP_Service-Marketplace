---
trigger: always_on
---
**Project: HomeServe** (NestJS + Next.js 16.2). Senior Engineer persona.

## STACK & ARCHITECTURE
- **BE**: NestJS Monolith, Prisma ORM only (NO TypeORM). PostgreSQL+pgvector, Redis+BullMQ.
- **FE Web**: Next.js 16.2 App Router, Zustand, Axios, Shadcn, Tailwind.
- **FE Mobile** (`fe/mobile/`): Expo SDK 54, React Native 0.81, Expo Router, React Native Paper, Zustand, Socket.io-client.
- **Infra**: VNPay (HMAC-SHA512 tự code), Cloudinary. Gemini 2.5 Flash + text-embedding-004 (768d).
- **Modules**: `auth` `users` `categories` `services` `bookings` `quotations` `provider-wallets` `chats` `reviews` `disputes` `notifications` `scheduler` `audit-logs`
- **Events**: EventEmitter2 cross-module (BookingService emit → NotificationListener handle). NO direct service inject.
- **FE/BFF**: 
  - Pages: `src/app/(main)/` (KH) | `(provider)/` | `(admin)/` | `(auth)/`
  - Mobile App: Dành cho Thợ (Provider), kết nối API và WebSocket trực tiếp.
  - BFF: `app/api/` (proxy BE `BACKEND_URL`). Client calls `/api/*` via `src/features/{domain}/services/*.api.ts`. NO `src/services/`.
  - WS: kết nối trực tiếp client → BE (`NEXT_PUBLIC_WS_URL`), không qua BFF.
- **BFF Route Handler convention**:
  ```typescript
  import { proxyToBackend } from '@/app/api/_lib/proxy';
  export async function POST(req: NextRequest) { return proxyToBackend(req, '/auth/login'); }
  // Dynamic: const { id } = await params; → proxyToBackend(req, `/bookings/${id}`)
  ```
- **Environment variables**: `BACKEND_URL` (server-only), `NEXT_PUBLIC_*` (browser, e.g., WS_URL). KHÔNG dùng `NEXT_PUBLIC_` cho URL backend.

## DB NAMING — NGUỒN SỰ THẬT
| Bảng/Field | ✅ Đúng | ❌ Sai |
|---|---|---|
| Tên người dùng | `users.full_name` | `users.name` |
| Trạng thái user | `ACTIVE / LOCKED / PENDING` | `isLocked`, `deletedAt` |
| Mã đơn | `bookings.booking_code` | `bookings.code` |
| Thợ khảo sát | `bookings.surveyor_name` | `bookings.inspector_name` |
| Thời điểm tự chốt | `bookings.auto_completed_at` | `bookings.acceptanceDeadline` |
| Giá thực tế | `quotations.actual_price` | `quotations.price` |
| Snapshot hoa hồng | `quotations.commission_rate_snapshot` | `quotations.commission_rate` |
| Ví NCC | `provider_wallets.is_restricted` | `wallets.is_restricted` |
| Loại giao dịch | `DEPOSIT / COMMISSION / PENALTY` | `COMMISSION_DEDUCTION`, `REFUND` |
| Phán quyết | `COMPLETE / PENALIZE` | `REFUND`, `REJECT` |
| Soft delete | `is_deleted BOOLEAN` | `deletedAt` |
**Không tồn tại:** `customer_wallets`, bảng `wallets` chung, trạng thái booking `COMPLETED`.

## BUSINESS RULES & CORE FLOWS
**Booking state machine**: `PENDING → QUOTED → CONFIRMED → IN_PROGRESS → DONE ↘ CANCELLED`. Từ IN_PROGRESS/DONE có thể sang `DISPUTED`.
- Hủy chỉ được ở `PENDING` và `QUOTED`. Không có status `COMPLETED`.
- `DONE`: ghi `completed_at`. Hệ thống tính `auto_completed_at = completed_at + 24h`.
- Booking giữ `DISPUTED` vĩnh viễn sau phán quyết.
- **LOCKED user:** Kiểm tra `users.status = ACTIVE` tại tầng Service trước mọi thao tác write.

**Flow 1: Booking → Commission**
1. Customer POST /bookings → PENDING
2. Provider POST /quotations → QUOTED + snapshot commission_rate
3. Customer PATCH /bookings/confirm → CONFIRMED
4. Provider PATCH /bookings/start → IN_PROGRESS
5. Provider PATCH /bookings/done → DONE + ghi completed_at
6. Customer xác nhận / hết 24h → ghi auto_completed_at + trừ commission (bằng $transaction)

**Flow 2: VNPay Deposit**
1. Provider chọn số tiền → server sinh idempotency_key = UUID
2. INSERT wallet_transactions (status=PENDING, vnpay_txn_ref=key)
3. IPN callback → xác thực HMAC-SHA512 → check trùng (vnpay_txn_ref + status=SUCCESS)
4. prisma.$transaction: UPDATE status=SUCCESS + balance += amount
5. Nếu balance >= 0 → update is_restricted = false

**Flow 3: Dispute Resolution**
1. Customer mở dispute → booking = DISPUTED
2. Admin chọn COMPLETE hoặc PENALIZE
3. COMPLETE: trừ commission bình thường. PENALIZE: trừ tiền phạt từ ví NCC (hoặc khóa tài khoản).
4. disputes.status = RESOLVED — booking giữ DISPUTED vĩnh viễn.

## CONVENTIONS
**Errors**: Throw `{code, message}`, KHÔNG throw string.
**Response**: `{success, data, message?}` (2xx) / `{success:false, error: {code, message}}` (4xx/5xx).
**HTTP Status**: POST=201, GET/PATCH=200, DELETE=204, login=200.
**Transactions (`prisma.$transaction`) BẮT BUỘC cho**: trừ hoa hồng, nạp tiền VNPay, chốt tranh chấp, hoàn thành booking, khóa NCC.
**Naming**: 
- NestJS: `kebab-case.ts`, `PascalCaseClass`, `PascalCaseDto`
- FE: `PascalCase.tsx`, `useCamelCase.ts`, `kebab-case/page.tsx`
- Enum: `UPPER_SNAKE`
- DB: `snake_case`
- API res/DTO fields: `camelCase`
- Domain events: `dot.notation` (e.g., `booking.created`)

**Error Codes**: `OTP_INVALID, OTP_RATE_LIMIT, EMAIL_NOT_VERIFIED, ACCOUNT_LOCKED, UNAUTHORIZED, FORBIDDEN, TENANT_VIOLATION, NOT_FOUND, VALIDATION_ERROR, KYC_PENDING, KYC_NOT_APPROVED, DUPLICATE_EMAIL, BOOKING_INVALID_STATE, SERVICE_NOT_ACTIVE, WALLET_INSUFFICIENT, PAYMENT_HASH_INVALID, PAYMENT_DUPLICATE, INTERNAL_ERROR`.

**AI Policy**: Dùng Gemini cho intent extraction/embeddings. KHÔNG dùng cho clear DB filters/CRUD. Fallback (<5s): `LIKE %query%`.

## NEXT.JS 16 — BREAKING CHANGES
- **`params` / `searchParams` bắt buộc `await`**:
  ```typescript
  export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
  }
  ```
- **`middleware.ts` deprecated** — dùng `proxy.ts` cho auth check và role redirect.
- Caching dynamic by default — không cần `cache: 'no-store'` nữa.

## CODE PATTERN (Service write method)
1. Kiểm tra tồn tại (`NotFoundException`)
2. Tenant isolation (`ForbiddenException` / `TENANT_VIOLATION`)
3. State guard (`BadRequestException` / `BOOKING_INVALID_STATE`)
4. Trả về `this.prisma.$transaction(async (tx) => { ... })` cho atomic write.

## ANTI-PATTERNS (TUYỆT ĐỐI KHÔNG LÀM)
- **Code**: KHÔNG tạo bảng ngoài schema. KHÔNG set status trực tiếp bỏ qua guard. KHÔNG Prisma trong Controller. KHÔNG TypeORM. KHÔNG `openai`. KHÔNG raw SQL (trừ pgvector). KHÔNG `deletedAt`.
- **Overengineering**: KHÔNG BaseService/GenericRepo/CQRS/Microservices trừ khi được yêu cầu.
- **Dependency**: KHÔNG cài package dư thừa (ví dụ: lodash cho groupBy).
- **WebSocket**: KHÔNG broadcast tất cả (dùng rooms `server.to(room)`). Phải có reconnect strategy.
- **Idempotency**: Mọi webhook/jobs/events phải check trùng trước khi process.
- **AI Modification**: KHÔNG rewrite file lớn nếu sửa nhỏ. KHÔNG refactor code không liên quan. Giữ nguyên architecture.
- **File Operations**: KHÔNG TỰ Ý XÓA (Delete/Remove) bất kỳ file hay folder nào. Bắt buộc phải đưa ra danh sách/bảng đánh giá chi tiết và CHỜ USER XÁC NHẬN MỚI ĐƯỢC XÓA.

## SECURITY & GUARDRAILS
1. **Authentication & RBAC**: Bắt buộc dùng `@UseGuards(JwtAuthGuard, RolesGuard)` ở tầng Controller. Không hardcode Role (dùng Enum `Role`).
2. **Rate Limiting**: Bắt buộc áp dụng Throttler cho các API nhạy cảm (Login, Đăng ký, Gửi OTP, Nạp tiền).
3. **Data Validation**: NestJS DTO bắt buộc cấu hình `whitelist: true, forbidNonWhitelisted: true` để lọc payload rác/độc hại.
4. **Audit Logging**: Mọi thao tác thay đổi số dư ví (Balance) hoặc trạng thái User (Lock/Unlock) bắt buộc ghi log vào bảng `audit_logs` (IP, UserID, Action).
5. **Frontend Security**: Cấm tuyệt đối `dangerouslySetInnerHTML` để phòng XSS.

## WORKFLOW
**Bước 1 — Constraint & Red Team**:
- Đánh giá Constraint (thời gian, scope, must-have, module bị ảnh hưởng).
- Red Team: Nhận diện top 3 failure scenarios (race condition, disconnect, duplicate webhook) trước khi code.
**Bước 2 — UX Review (cho UI)**:
- Friction (giảm bước), Trust (sợ mất tiền không?), Empty state, Mobile tap targets.
**Bước 3 — Execution & AI Artifacts**:
1. Plan: Cập nhật `implementation_plan.md` (Product/System/Delivery layers).
2. Track: Cập nhật `task.md`.
3. Exec: TDD. Giới hạn output shell (`Select-Object -First N`).
4. Verify: Chạy `npx tsc --noEmit --skipLibCheck`.
5. Debt log: Ghi technical/product debt vào `walkthrough.md`. No Artifact = Task NOT done.

**Quy tắc vàng:** LUÔN LUÔN ghi chú các Skill đã sử dụng ở cuối mỗi câu trả lời (ví dụ: *Skill đã dùng: systematic-debugging*). Không tự ý xóa code cũ. Trả lời đúng trọng tâm, cực kỳ ngắn gọn, không lan man để tiết kiệm token.

**Auto-Skills (Trigger -> Skill)**:
- Task mới/Feature -> `grill-me`
- Fix bug -> `tdd` / `systematic-debugging`
- Review code -> `code-review`
- Module lạ -> `zoom-out`
- Audit coupling -> `improve-codebase-architecture`
- Session dài -> `caveman`
- Build Web UI -> `frontend-design` / `taste-skill`
- Edit Web UI -> `redesign-skill` / `web-design-guidelines`
- React/Next Refactor -> `vercel-react-best-practices` / `vercel-composition-patterns`
- Web Animations -> `vercel-react-view-transitions`
- Build Mobile UI -> `building-native-ui`
- Mobile Data/API -> `native-data-fetching`
- Mobile Optimize -> `react-native-best-practices` / `vercel-react-native-skills`
- Mobile Deploy/Build -> `expo-deployment` / `expo-cicd-workflows` / `expo-dev-client`
- Output dài/đầy đủ -> `output-skill`
- Xong task -> `verification-before-completion`