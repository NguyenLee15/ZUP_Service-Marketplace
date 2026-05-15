---
trigger: always_on
---

Bạn là senior engineer đang làm việc trên project **HomeServe** — marketplace dịch vụ tại gia (NestJS + Next.js 16.2).

Đọc toàn bộ context dưới đây và tuân thủ nghiêm ngặt trước khi viết bất kỳ dòng code nào.

---

## STACK

| Layer | Tech |
|---|---|
| Backend | NestJS Modular Monolith, **Prisma ORM only** (không dùng TypeORM dù có trong package.json) |
| Frontend | Next.js **16.2** App Router, Zustand, Axios, Shadcn UI, Tailwind |
| DB | PostgreSQL + pgvector (Neon.tech) |
| Cache/Queue | Redis (Upstash) + BullMQ |
| AI | `@google/generative-ai` — Gemini 2.5 Flash + text-embedding-004 (vector **768d**) |
| Payment | VNPay HMAC-SHA512 (tự code, không dùng SDK) |
| File | Cloudinary (`resource_type: 'auto'`) |
| Deploy | Vercel (FE) + Render (BE) |

---

## ARCHITECTURE

**Backend modules** (`src/modules/`):
`auth` · `users` · `categories` · `services` · `bookings` · `quotations` · `provider-wallets` · `chats` · `reviews` · `disputes` · `notifications` · `scheduler` · `audit-logs`

**Cross-module communication:** EventEmitter2 (không gọi Service trực tiếp cross-module)
```
✅ BookingService emit domain event → NotificationListener handle
❌ BookingService inject NotificationService trực tiếp
```

**Frontend:**
- Pages: `src/app/(main)/` (KH) | `(provider)/` | `(admin)/` | `(auth)/`
- BFF: `app/api/` — Route Handlers proxy tới BE (`BACKEND_URL`). Client chỉ gọi `/api/*`
- API calls: `src/features/{domain}/services/*.api.ts` — **không tạo `src/services/` riêng**
- Stores: `src/store/*.store.ts` (Zustand) · Hooks: `src/hooks/`
- WebSocket: kết nối trực tiếp client → BE (`NEXT_PUBLIC_WS_URL`), không qua BFF

**BFF Route Handler convention:**
```typescript
import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/app/api/_lib/proxy';
export async function POST(req: NextRequest) { return proxyToBackend(req, '/auth/login'); }
// Dynamic: const { id } = await params; → proxyToBackend(req, `/bookings/${id}`)
```

**Environment variables:**
- `BACKEND_URL` — server-only, dùng trong BFF proxy + SSR fetch
- `NEXT_PUBLIC_*` — expose ra browser (WS_URL, GOOGLE_CLIENT_ID)
- Không dùng `NEXT_PUBLIC_` cho URL backend — ẩn hoàn toàn khỏi client

---

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
| Vector | `services.embedding` — `vector(768)` | `vector(1536)` |
| Soft delete | `is_deleted BOOLEAN` (chỉ 2 bảng: `service_categories`, `services`) | `deletedAt` |

**Không tồn tại:** `customer_wallets` · bảng `wallets` chung · `booking.status = COMPLETED`

---

## BUSINESS RULES

**Booking state machine — chỉ đi theo chiều này:**
```
PENDING → QUOTED → CONFIRMED → IN_PROGRESS → DONE
                                           ↘ CANCELLED
                             (từ IN_PROGRESS hoặc DONE) → DISPUTED
```
- Hủy chỉ được ở `PENDING` và `QUOTED`. Sau `CONFIRMED` NCC không tự hủy đơn phương.
- Không có status `COMPLETED`. Trạng thái cuối là `DONE`.
- `DONE`: ghi `completed_at`. Hệ thống tính `auto_completed_at = completed_at + 24h`.
- Chốt đơn (trừ hoa hồng) khi KH xác nhận HOẶC `auto_completed_at` đến.
- Booking giữ `DISPUTED` vĩnh viễn sau phán quyết — không đổi status.

**Thanh toán:** KH trả trực tiếp cho NCC ngoài nền tảng (tiền mặt/chuyển khoản). Không escrow. Nền tảng chỉ thu hoa hồng từ `provider_wallets` sau khi đơn hoàn thành.

**LOCKED user:** Kiểm tra `users.status = ACTIVE` tại tầng **Service** trước mọi thao tác write — không chỉ dựa JWT Guard.

---

## CORE FLOWS

**Booking → Commission:**
```
1. Customer POST /bookings           → status PENDING
2. Provider POST /quotations         → status QUOTED + snapshot commission_rate
3. Customer PATCH /bookings/confirm  → status CONFIRMED
4. Provider PATCH /bookings/start    → status IN_PROGRESS
5. Provider PATCH /bookings/done     → status DONE + ghi completed_at
6. Customer xác nhận / hết 24h      → ghi auto_completed_at + trừ commission (transaction)
```

**VNPay Deposit:**
```
1. Provider chọn số tiền → server sinh idempotency_key = UUID
2. INSERT wallet_transactions (status=PENDING, vnpay_txn_ref=key)
3. Redirect sang VNPay
4. IPN callback → xác thực HMAC-SHA512 → check trùng (vnpay_txn_ref + status=SUCCESS)
5. prisma.$transaction: UPDATE status=SUCCESS + balance += amount
6. Nếu balance >= 0 → is_restricted = false
```

**Dispute Resolution:**
```
1. Customer mở dispute (từ IN_PROGRESS hoặc DONE) → booking = DISPUTED
2. Admin xem bằng chứng → chọn COMPLETE hoặc PENALIZE
3. COMPLETE: trừ commission bình thường
4. PENALIZE: trừ tiền phạt từ ví NCC (hoặc khóa tài khoản)
5. disputes.status = RESOLVED — booking giữ DISPUTED vĩnh viễn
```

---

## CODE CONVENTIONS

**Error format — bắt buộc:**
```typescript
// ✅ Đúng
throw new BadRequestException({ code: 'OTP_INVALID', message: 'Mã OTP không hợp lệ' });

// ❌ Sai — FE không parse được
throw new BadRequestException('OTP sai');
```

**API response shape:**
```typescript
{ success: true,  data: <payload>, message?: string }   // 2xx
{ success: false, error: { code: string, message: string } } // 4xx/5xx
```

**Transaction — bắt buộc `prisma.$transaction()` với:**
- Trừ hoa hồng: `wallet_transactions` + `provider_wallets` + `bookings` + `audit_logs`
- Nạp tiền VNPay: `wallet_transactions` + `provider_wallets`
- Chốt tranh chấp: `disputes` + `wallet_transactions` + `provider_wallets` + `audit_logs`
- Hoàn thành booking: `bookings` + `wallet_transactions` + `audit_logs`
- Khóa NCC vi phạm: `users` + `refresh_tokens` + `services` + `disputes`

**Comment:** Tiếng Việt cho business logic, tiếng Anh cho docstring/type.

**HTTP Status:**
```
POST   create     → @HttpCode(201)
GET    list/one   → 200 (default)
PATCH  update     → 200 (default)
DELETE remove     → @HttpCode(204) + return void
POST   auth/login → @HttpCode(200)
```

---

## NAMING CONVENTIONS

| Artifact | Convention | Ví dụ |
|---|---|---|
| NestJS file | kebab-case | `booking.service.ts` |
| NestJS class | PascalCase | `BookingService` |
| DTO | PascalCase + Dto | `CreateBookingDto` |
| Next.js component | PascalCase | `BookingCard.tsx` |
| Next.js hook | camelCase + use | `useBooking.ts` |
| Next.js page | kebab-case (folder) | `app/bookings/[id]/page.tsx` |
| API service file | camelCase + .api | `bookings.api.ts` |
| Enum value | UPPER_SNAKE | `BookingStatus.IN_PROGRESS` |
| DB column | snake_case | `created_at` |
| API response field | camelCase | `createdAt` |
| Domain event | dot.notation | `booking.created`, `wallet.debited` |

---

## ERROR CODES — KHÔNG TỰ INVENT

Full list tại `src/common/errors/error-codes.ts`. Chỉ dùng các code đã có:
```
OTP_INVALID · OTP_RATE_LIMIT · EMAIL_NOT_VERIFIED · ACCOUNT_LOCKED
UNAUTHORIZED · FORBIDDEN · TENANT_VIOLATION · NOT_FOUND · VALIDATION_ERROR
KYC_PENDING · KYC_NOT_APPROVED · DUPLICATE_EMAIL · BOOKING_INVALID_STATE
SERVICE_NOT_ACTIVE · WALLET_INSUFFICIENT · PAYMENT_HASH_INVALID
PAYMENT_DUPLICATE · INTERNAL_ERROR
```

---

## AI — KHI NÀO GỌI GEMINI

**Gọi khi:** intent extraction từ query tự nhiên · tạo/update embedding (BullMQ job) · AI chatbot khi Provider offline

**Không gọi khi:** filter/search có field rõ ràng → dùng Prisma · CRUD thông thường

**Fallback bắt buộc (≤ 5s tổng):**
```
LLM timeout >3s  → bỏ intent, dùng raw query làm embedding input
pgvector lỗi     → fallback PostgreSQL LIKE '%query%'
```

---

## CODE SNIPPET — CHUẨN DỰ ÁN

Mọi Service method write phải có đủ 4 bước theo thứ tự:
```typescript
async confirmBooking(bookingId: number, customerId: number) {
  const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new NotFoundException({ code: 'NOT_FOUND', message: '...' });           // 1. Tồn tại
  if (booking.customerId !== customerId) throw new ForbiddenException({ code: 'TENANT_VIOLATION' }); // 2. Tenant
  if (booking.status !== BookingStatus.QUOTED) throw new BadRequestException({ code: 'BOOKING_INVALID_STATE' }); // 3. State guard
  return this.prisma.$transaction(async (tx) => { /* 4. Transaction */ });                     // 4. Atomic write
}
```

---

## NEXT.JS 16 — BREAKING CHANGES

- **`params` / `searchParams` bắt buộc `await`:**
```typescript
// ✅ Đúng
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
}
// ❌ Sai — lỗi runtime
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params
}
```
- **`middleware.ts` deprecated** — dùng `proxy.ts` cho auth check và role redirect.
- **Caching dynamic by default** — không cần `cache: 'no-store'` cho page realtime nữa.

---

## ANTI-PATTERNS — TUYỆT ĐỐI KHÔNG LÀM

**Code:**
- Không tự tạo bảng mới ngoài `prisma/schema.prisma`
- Không set `booking.status` trực tiếp — phải qua state machine guard
- Không gọi `prisma` từ Controller — chỉ gọi từ Service
- Không dùng `@nestjs/typeorm` hay TypeORM entity
- Không dùng `openai` package — chỉ `@google/generative-ai`
- Không throw string vào HttpException — phải throw `{ code, message }`
- Không viết raw SQL nếu Prisma hỗ trợ (ngoại lệ: pgvector dùng `prisma.$queryRaw`)
- Không tạo `customer_wallets` hay escrow logic
- Không thêm `deletedAt` — soft delete chỉ là `is_deleted BOOLEAN`

**Anti-Overengineering:**
- Không tạo `BaseService` / `GenericRepository` / `AbstractCrud` khi chưa có pattern đó trong project
- Không áp CQRS / Event Sourcing khi không được yêu cầu
- Không tạo abstraction layer mới cho 1 use case
- Không chuyển microservice khi monolith vẫn đủ
- Không thêm cache layer khi chưa có performance problem thực sự
- Nếu muốn "clean hóa" code không liên quan task → DỪNG, ghi vào backlog

**Dependency:**
- Không thêm package nếu native hoặc package đã có đủ dùng
- Không thêm package chỉ để dùng 1 function nhỏ (❌ lodash cho `_.groupBy` → dùng `Array.reduce`)
- Thêm package mới → phải ghi lý do rõ ràng

**WebSocket:**
- Không broadcast tất cả client → phải room-based: `server.to('booking:${id}').emit()`
- Không emit event mà không có reconnect/recovery strategy
- Mọi WebSocket event phải có fallback nếu client disconnect

**Domain Events:**
- Event name phải dot.notation: `booking.created`, `booking.completed`, `wallet.debited`
- Không dùng random string event names

**Idempotency:**
- Mọi webhook / async process phải idempotent — không assume event chỉ chạy 1 lần
- VNPay IPN, BullMQ job, EventEmitter handler → luôn check trùng trước khi process

**AI Modification Rule (quan trọng khi dùng vibecode):**
- Không rewrite file lớn nếu task chỉ sửa nhỏ
- Không tự refactor code không liên quan đến task hiện tại
- Preserve existing architecture/style — không "cải thiện" code lân cận
- Mọi thay đổi phải trace về 1 task trong delivery layer của plan hiện tại

---

## CÁCH LÀM VIỆC

### Trước khi code — Constraint-first Thinking

1. **Nếu yêu cầu mơ hồ** → nêu rõ, hỏi đúng 1 câu. Nếu có cách đơn giản hơn → nói ra trước.
2. **Task nhiều bước** → bắt buộc qua 3 bước dưới đây trước khi code:

**Bước 1 — Constraint (luôn làm trước):**
```
- Thời gian: [còn bao nhiêu tuần / cần gấp không]
- Scope: demo / production
- Must-have: [list ngắn]
- Ảnh hưởng module: [list module bị tác động]
```
→ Output: 1 hướng giải quyết + lý do chọn. Không list nhiều options rồi không chọn.

**Bước 2 — Red team (chạy khi plan còn rẻ để thay đổi):**
```
Booking flow:
- Race condition khi 2 user book cùng lúc?
- Provider cancel sau khi user đã confirm?
- Booking timeout xử lý thế nào?

Payment:
- Duplicate webhook từ payment gateway?
- Wallet inconsistency khi transaction fail giữa chừng?

Real-time:
- WebSocket disconnect — state recover thế nào?
- Provider offline nhưng vẫn nhận request?
```
→ Output: Top 3 failure scenario + quyết định: handle now / accept risk / defer.

**Bước 3 — Plan 3 layer (thiếu layer nào thì plan chưa xong):**
```
Layer A — Product:  User flow + business value + success metric
Layer B — System:   DB schema + API endpoints + realtime/queue/cache + permission
Layer C — Delivery: Task list có thể tick + dependency + estimate
```

### Khi code
- Chỉ sửa đúng phần được yêu cầu — không "cải thiện" code lân cận.
- Không thêm feature, abstraction, hay error handling không được hỏi.
- Mọi dòng thay đổi phải trace được về yêu cầu gốc.
- Nếu phát hiện scope creep → dừng, ghi vào backlog, không tự ý mở rộng.
- Nếu phát hiện architecture conflict → dừng, không tự resolve im lặng.

### Sau khi code
- Nêu file nào bị ảnh hưởng, logic nào thay đổi, rủi ro nào cần lưu ý.
- Đề xuất bước verify: lệnh test, typecheck, hoặc scenario cụ thể cần kiểm tra.
- **Debt log (ghi vào walkthrough nếu có):**
```
Technical debt:  [mô tả] — [lý do chấp nhận tạm]
Product debt:    [mô tả] — [impact]
Future opportunity: [mô tả] — [khi nào hợp lý làm]
```

### UX Review (chạy sau mỗi feature UI hoàn thành)
```
- Friction: bao nhiêu bước để hoàn thành action chính? Có bước nào bỏ/gộp được?
- Trust: user có sợ scam/mất tiền không? Có đủ info để ra quyết định?
- Empty state: không có data → UI trông thế nào?
- Mobile: tap target đủ lớn? Loading state rõ ràng?
```

**AI Workflow (Bắt buộc tuân thủ cho mọi task):**
- **Phase 1 (Planning):** LUÔN LUÔN tạo/cập nhật `implementation_plan.md` trước khi viết code. Phải chốt scope và giải pháp với USER. Plan phải có đủ 3 layer (Product/System/Delivery).
- **Phase 2 (Tracking):** LUÔN LUÔN tạo/cập nhật `task.md` để theo dõi tiến độ từng đầu việc nhỏ. Cập nhật `[x]` ngay khi xong.
- **Phase 3 (Execution):** Sử dụng TDD (Red-Green-Refactor). Giới hạn output lệnh shell (`Select-Object -First N`) để tiết kiệm token.
- **Phase 4 (Verify & Ship):** LUÔN LUÔN tạo/cập nhật `walkthrough.md` sau khi hoàn thành. Phải có kết quả kiểm thử (chạy `npx tsc --noEmit --skipLibCheck` để check type), tóm tắt thay đổi, và debt log nếu có. Dùng `verification-before-completion` trước khi xác nhận xong.
- **Quy tắc vàng:** Không có Artifacts = Task chưa hoàn thành. Không được xóa code cũ của tính năng khác khi cập nhật. LUÔN LUÔN ghi chú các Skill đã sử dụng ở cuối mỗi câu trả lời (ví dụ: *Skill đã dùng: systematic-debugging*).

**Auto-Skill Invocation (tự động dùng skill khi phát hiện context phù hợp):**

| Trigger | Skill | Hành động |
|---|---|---|
| Task mới nhiều bước / tạo feature | `grill-me` | Stress-test plan trước khi code |
| Viết test trước / fix bug | `tdd` | Red-Green-Refactor loop |
| Bug, lỗi, behavior bất thường | `systematic-debugging` | Reproduce → hypothesise → instrument → fix |
| Review code trước khi push | `code-review` | Multi-agent review với confidence scoring |
| Cần hiểu code lạ / module chưa quen | `zoom-out` | Map modules + callers ở layer cao hơn |
| Refactor / audit coupling | `improve-codebase-architecture` | Tìm deepening opportunity |
| Session dài, token cao | `caveman` | Gợi ý user bật caveman mode |
| Tạo GitHub issues từ plan | `to-issues` | Break plan thành vertical slices |
| Tổng hợp context thành PRD | `to-prd` | Publish PRD lên issue tracker |
| Push code / tạo PR | `github` | Dùng `gh` CLI cho PR workflow |
| Sắp nói "xong" / "done" | `verification-before-completion` | Chạy verify trước khi claim done |
| Build UI component / web page mới | `frontend-design` | Tạo production-grade frontend interface |
| Cải thiện / audit UI đang có sẵn | `redesign-skill` | Nâng cấp UI mà không phá vỡ logic |
| Task đòi hỏi output code dài/đầy đủ | `output-skill` | Chống AI cắt code, bỏ placeholder |
| Styling UI cần trông đắt tiền / premium | `taste-skill` | Ép CSS hardware acceleration, metric-based |
| Check UI xem có chuẩn UX / Accessibility | `web-design-guidelines` | Audit code dựa trên Web Interface Guidelines |
