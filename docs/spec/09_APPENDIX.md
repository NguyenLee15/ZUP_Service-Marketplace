<!-- FILE: 09_APPENDIX.md | SCOPE: Đề xuất cải thiện · Implementation Quick Reference -->

## ĐỀ XUẤT CẢI THIỆN {#de-xuat}

### 1. Bảo mật & Xác thực

- **Thêm OAuth2 / Đăng nhập bằng Google/Facebook:** Giảm ma sát cho người dùng mới, đặc biệt phù hợp với đối tượng Khách hàng.
- **Mã hóa E2E cho chat:** Nâng cấp UC18.1 với mã hóa end-to-end để bảo vệ nội dung nhạy cảm giữa hai bên.
- **2FA cho Admin/Staff:** Thêm xác thực hai yếu tố (TOTP/SMS) cho tài khoản quản trị viên và nhân viên.

### 2. Luồng nghiệp vụ

- **Thanh toán linh hoạt (UC16.2/UC12.3):** Bổ sung tùy chọn **escrow qua VNPay** – KH đặt cọc khi xác nhận báo giá, NCC nhận tiền sau khi hoàn thành nghiệm thu. Tăng độ tin cậy và giảm tranh chấp đáng kể so với thanh toán offline.
- **Đánh giá NCC bởi cả hai phía:** Cho phép NCC đánh giá lại KH (độ hợp tác, uy tín thanh toán) để xây dựng hệ sinh thái đánh giá hai chiều.
- **Tái phân công tranh chấp tự động (UC09.1):** Nếu nhân viên phụ trách không xử lý tranh chấp trong X giờ, hệ thống tự động tái phân công cho nhân viên khác. Hiện tại chỉ Admin thủ công; X nên đọc từ bảng cấu hình (không hard-code).
- **Attachment trong chat (UC18.1):** Cho phép gửi ảnh/file trong cuộc hội thoại. Cần thêm: upload endpoint riêng, cloud storage private, giới hạn kích thước file, virus scan.

### 3. Tính năng AI

- **Cá nhân hóa gợi ý (UC15.3):** Dựa trên lịch sử booking cũ của KH (loại dịch vụ, khu vực, NCC quen) để cá nhân hóa kết quả AI gợi ý thay vì chỉ dùng text query.
- **Tóm tắt AI cho phân xử tranh chấp (UC09.2):** AI tự động tóm tắt lịch sử chat và bằng chứng hai bên để hỗ trợ nhân viên phân xử nhanh hơn.
- **Phát hiện gian lận tự động:** AI quét pattern bất thường (đánh giá ảo, booking giả, tài khoản clone) và gắn cờ để Admin xem xét.

### 4. UX / Tính năng phụ

- **Nhắc lịch trước nhiều mốc thời gian:** Hiện tại chỉ nhắc 24h và 6h. Có thể thêm nhắc 1 ngày trước, 1 giờ trước (đọc từ bảng cấu hình).
- **Progressive Web App (PWA):** Biến ứng dụng web thành PWA để KH và NCC cài đặt lên điện thoại và nhận push notification không cần app store.
- **Chức năng báo giá nhiều lựa chọn (UC12.3):** NCC có thể gửi 2–3 gói báo giá (tiết kiệm, chuẩn, cao cấp) để KH lựa chọn thay vì chỉ một mức giá.
- **Read receipt / Seen status (UC18.1):** Hiển thị trạng thái "đã xem" cho tin nhắn trong chat — hữu ích để KH biết NCC đã đọc chưa.

### 5. Quản trị & Vận hành

- **Dashboard Admin real-time:** Ngoài báo cáo theo yêu cầu (UC10.1/10.2), thêm dashboard real-time hiển thị: booking đang xử lý, tranh chấp chờ phân xử, NCC vừa đăng ký, trạng thái AI service.
- **Bulk actions cho duyệt dịch vụ/KYC:** Cho phép Admin chọn nhiều hồ sơ/dịch vụ và duyệt/từ chối hàng loạt thay vì xử lý từng cái.
- **Cấu hình SLA linh hoạt:** Hiện tại một số SLA (24h nghiệm thu, 5 phút hoàn tác) đang định nghĩa trong spec. Nên đưa toàn bộ vào bảng cấu hình DB để Admin điều chỉnh mà không cần deploy lại.
- **Webhook cho sự kiện quan trọng (UC19):** Cho phép tích hợp bên ngoài (Slack, Zalo OA, v.v.) nhận thông báo khi có sự kiện quan trọng trong hệ thống.
- **Scaling chat đa node:** Khi hệ thống mở rộng lên nhiều Backend node, cần message broker (Redis Pub/Sub hoặc Kafka) để đồng bộ WebSocket event giữa các node — không để user A và user B kết nối vào 2 node khác nhau không nhận được tin nhắn của nhau.

---

## PHỤ LỤC — IMPLEMENTATION QUICK REFERENCE

> Phần này tổng hợp các quyết định kỹ thuật đã cam kết, dùng để đối chiếu khi code và khi bảo vệ đồ án.

### A. Prisma Schema — Enum thực tế

```prisma
enum BookingStatus  { PENDING QUOTED CONFIRMED IN_PROGRESS DONE DISPUTED CANCELLED }
enum ServiceStatus  { DRAFT PENDING ACTIVE HIDDEN REJECTED }
enum UserStatus     { ACTIVE LOCKED PENDING }
enum KycStatus      { PENDING APPROVED REJECTED }
enum SenderType     { CUSTOMER PROVIDER AI }
enum DisputeStatus  { PENDING IN_REVIEW RESOLVED }
enum DisputeResolutionAction { COMPLETE PENALIZE }  // COMPLETE = chốt bình thường | PENALIZE = KH thắng → phạt NCC
enum WalletTransactionType   { DEPOSIT COMMISSION PENALTY }  // PENALTY = khoản phạt khi NCC thua tranh chấp
enum WalletTransactionStatus { SUCCESS FAILED PENDING }
```

### B. Transaction Boundaries (prisma.$transaction)

| Flow | Bảng liên quan | Ghi chú |
|---|---|---|
| Nạp tiền ví NCC (UC14.2) | `wallet_transactions` + `provider_wallets` | IPN VNPay — idempotency key bắt buộc (`vnpay_txn_ref`) |
| Commission debit (UC17.2) | `provider_wallets` + `wallet_transactions` + `bookings` | Chốt đơn DONE — set `is_restricted` nếu balance âm |
| Dispute phán quyết PENALIZE (UC09.2) | `disputes` + `provider_wallets` + `wallet_transactions` + `audit_logs` | 5 phút countdown → execute; penalty amount do Admin nhập |
| Dispute phán quyết COMPLETE (UC09.2) | `disputes` + `bookings` + `audit_logs` | Chốt bình thường, không động ví |

> **Quy tắc:** Flow chạm ≥ 2 bảng quan trọng → bắt buộc `prisma.$transaction()`. Không cache booking status và wallet balance.

### C. Caching Strategy (Redis — Upstash)

| Key | TTL | Mục đích |
|---|---|---|
| `otp:{email}:{type}` | 10 phút | OTP code |
| `otp:cooldown:{email}` | 60 giây | Cooldown gửi lại |
| `otp:daily:{email}` | 24 giờ | Đếm số lần gửi/ngày |
| `login:fail:{email}` | 15 phút | Brute-force lock |
| `typing:{conv_id}:{user_id}` | 3 giây | Typing indicator |
| `online_users` | Hash, không expire | Provider online status |
| `ai_failures` | 60 giây | Circuit breaker counter |
| `ai_circuit_open` | 5 phút | Circuit breaker flag |
| `unread:{user_id}` | Invalidate khi có message mới | Total unread count |

### D. API Response Standard

```typescript
// Thành công
{ success: true, data: T }

// Lỗi
{ success: false, error: { code: string, message: string } }

// Throw trong service:
throw new BadRequestException({ code: 'BOOKING_NOT_FOUND', message: 'Booking không tồn tại' });
```

### E. Cronjob Registry

| Job | Schedule | Mục đích |
|---|---|---|
| Auto-complete booking | `0 * * * *` (mỗi giờ) | Tìm DONE booking có `auto_completed_at <= NOW()` → trừ hoa hồng |
| Dispute SLA alert | `0 9 * * *` (9AM hàng ngày) | Tranh chấp > 24h chưa xử lý → cảnh báo Admin |
| Embedding stale check | `0 2 * * 0` (2AM Chủ nhật) | Re-embed service description > 7 ngày chưa update |
| **SLA: No-show check** | `*/30 * * * *` (mỗi 30 phút) | Tìm CONFIRMED booking quá `desired_time + X giờ` mà NCC chưa chuyển IN_PROGRESS → unlock KH được hủy miễn phí |
| **SLA: Stuck IN_PROGRESS** | `0 8 * * *` (8AM hàng ngày) | Tìm IN_PROGRESS booking quá Y ngày → gửi cảnh báo NCC; nếu quá Z ngày → tự động chuyển DONE để ép vào luồng nghiệm thu 24h |

**Tham số SLA (đọc từ bảng `commission_configs` hoặc bảng config riêng — không hard-code):**
- X (no-show threshold): mặc định 4 giờ sau `desired_time`
- Y (nhắc NCC): mặc định 3 ngày ở IN_PROGRESS
- Z (tự động DONE): mặc định 7 ngày ở IN_PROGRESS

**Xử lý edge case No-show (CONFIRMED quá giờ):** Cronjob set một flag `can_cancel_free = true` trong Redis key `booking:noshow:{id}` (TTL 72h). Khi KH vào xem đơn, FE check flag này để hiện nút "Hủy miễn phí". Thao tác hủy thực tế vẫn do KH chủ động — không tự động hủy để tránh trường hợp NCC đến muộn nhưng vẫn đến. Khi hủy được ghi nhận, tạo notification cảnh báo cho Admin về NCC có hành vi no-show.

### E2. BullMQ Named Jobs Registry

Mỗi Named Job tương ứng với một Worker riêng trong NestJS. Đặt tên job theo convention `{domain}.{action}` để dễ group Worker theo module.

| Job Name | Queue | Trigger | Worker xử lý |
|---|---|---|---|
| `auth.send-otp-email` | `auth-queue` | Đăng ký / Quên mật khẩu | Gọi Nodemailer gửi OTP qua Gmail SMTP |
| `auth.send-welcome-email` | `auth-queue` | Đăng ký thành công | Gửi email chào mừng |
| `service.generate-embedding` | `ai-queue` | Tạo mới / cập nhật dịch vụ | Gọi Gemini `text-embedding-004`, lưu vector 768 chiều vào `services.embedding` |
| `service.reembed-stale` | `ai-queue` | Cronjob Chủ nhật 2AM | Re-embed hàng loạt service chưa cập nhật embedding > 7 ngày |
| `service.scan-sensitive-keywords` | `ai-queue` | Tạo mới / cập nhật dịch vụ | Gọi Gemini 2.5 Flash quét từ khóa cấm, set `is_sensitive = true` nếu vi phạm |
| `booking.send-reminder` | `notification-queue` | Scheduler 24h trước `desired_time` | Gửi notification + email nhắc lịch cho KH và NCC |
| `booking.auto-complete` | `booking-queue` | Cronjob mỗi giờ | Chốt đơn DONE + trừ hoa hồng (idempotent); xử lý **tuần tự theo từng NCC** để tránh deadlock |
| **`booking.sla-noshow-alert`** | **`booking-queue`** | **Cronjob 30 phút** | **Set Redis flag `can_cancel_free`, gửi notification KH được phép hủy** |
| **`booking.sla-stuck-inprogress`** | **`booking-queue`** | **Cronjob 8AM hàng ngày** | **Cảnh báo NCC sau Y ngày; tự động DONE sau Z ngày** |
| `chat.ai-reply` | `ai-queue` | KH gửi tin khi NCC offline | Gọi Gemini 2.5 Flash sinh AI reply, persist vào `messages` |
| `notification.push` | `notification-queue` | Mọi sự kiện cần thông báo | Ghi vào bảng `notifications`, emit Socket.io event nếu user online |
| `kyc.notify-admin` | `notification-queue` | NCC nộp KYC mới | Gửi notification đến tất cả Admin/Staff có quyền duyệt KYC |
| **`cloudinary.cleanup-orphans`** | **`storage-queue`** | **Cronjob 2AM hàng ngày** | **Quét bản ghi `attachments` ở trạng thái `PENDING` quá 24h → xóa file Cloudinary + xóa DB record** |

**Retry policy mặc định cho tất cả job:** tối đa 3 lần, exponential backoff (1s → 3s → 9s). Job thất bại sau 3 lần chuyển vào Dead Letter Queue để Admin xem xét thủ công.

### F. AI Pipeline — Quyết định đã cam kết

Hệ thống dùng **Gemini 2.5 Flash** cho các tác vụ sinh ngôn ngữ (intent extraction, chatbot, explanation) và **text-embedding-004** cho vector embedding. Vector dimension là **768 chiều** (thay vì 1536 của OpenAI text-embedding-3-small trước đây).

```
1. Intent extraction: Gemini 2.5 Flash → {service_type, urgency, area_hint}
                      Dùng response_schema (JSON mode) để ép output chuẩn xác,
                      không cần parse text thủ công.
2. Query embedding:   text-embedding-004 → vector 768 dims
3. Retrieval:         pgvector cosine similarity → top-50 candidates
4. Re-ranking:        Rule-based scoring (w1..w5) → top-10
5. Explanation:       Gemini 2.5 Flash (optional, skip nếu budget time < 0.5s còn lại)

Fallback tier 1: Skip LLM intent → raw query embedding → vector search
Fallback tier 2: Skip vector → PostgreSQL LIKE '%query%' (< 5s total timeout)
Circuit breaker:  3 lỗi/60s → ai_circuit_open 5 phút → tier 2 ngay
```

**Lợi thế `response_schema` của Gemini 2.5 Flash:** Khi gọi intent extraction, ta truyền JSON Schema trực tiếp vào API call — Gemini đảm bảo output luôn đúng cấu trúc, không sinh text thừa, không cần regex hay try-catch parse. Khác với gpt-4o-mini yêu cầu prompt engineering phức tạp để đạt structured output tương đương.

```typescript
const result = await gemini.generateContent({
  contents: [{ role: 'user', parts: [{ text: userQuery }] }],
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        service_type: { type: 'string' },
        urgency:      { type: 'string', enum: ['low', 'medium', 'high'] },
        area_hint:    { type: 'string', nullable: true },
        budget_hint:  { type: 'string', nullable: true },
      },
      required: ['service_type', 'urgency'],
    },
  },
});
// Output luôn là JSON hợp lệ, parse trực tiếp không cần try-catch
const intent = JSON.parse(result.response.text());
```

**Re-ranking score formula:**

```typescript
score = (
  W.semantic     * semantic_similarity       // Độ khớp ngữ nghĩa với query
+ W.rating       * avg_rating_normalized     // Điểm đánh giá (1-5 → 0-1)
+ W.completion   * completion_rate           // Tỉ lệ hoàn thành đơn của NCC
+ W.proximity    * distance_score            // Gần địa chỉ KH (15km max → 1.0)
+ W.recency      * recency_score             // Dịch vụ tạo gần đây (decay 30 ngày)
+ W.personal     * personalization_score     // Khớp category ưa thích của KH
) * urgency_multiplier                       // 1.3 nếu query có urgency = high
```

| Signal | Ký hiệu | Trọng số (W) | Lý do |
|---|---|---|---|
| `semantic_similarity` | W.semantic | **0.30** | Tiêu chí quan trọng nhất — khớp đúng nhu cầu |
| `avg_rating_normalized` | W.rating | **0.25** | Uy tín NCC, được KH xác nhận qua đánh giá thực tế |
| `completion_rate` | W.completion | **0.20** | NCC hay hủy đơn sẽ bị hạ thứ hạng tự nhiên |
| `distance_score` | W.proximity | **0.15** | Dịch vụ tại gia → khoảng cách ảnh hưởng trực tiếp đến UX |
| `recency_score` | W.recency | **0.05** | Ưu tiên NCC đang hoạt động, không để hồ sơ cũ chiếm top |
| `personalization_score` | W.personal | **0.05** | Khớp lịch sử category của KH (bỏ qua nếu chưa đủ data) |

> ⚠️ Trọng số W đọc từ config DB — Admin có thể chỉnh không cần deploy lại (xem UC10).

**Cold start cho NCC mới (chưa có booking/rating):**
- `avg_rating_normalized = 0` → compensate bằng `recency_score` cao (mới tham gia = bonus)
- `completion_rate = 0` → dùng `profile_completeness` thay thế (có avatar, mô tả >200 ký tự, KYC approved...)
- Đảm bảo NCC mới vẫn xuất hiện trong kết quả, không bị đẩy xuống cuối

### G. File Upload — Cloudinary

```typescript
// Upload config
cloudinary.upload(file, {
  folder: `chat/${conversation_id}/${year}/${month}`,
  resource_type: 'auto',  // auto-detect: image/video/raw
  access_mode: 'authenticated',  // private — cần signed URL
})

// Sinh signed URL (TTL 15 phút cho chat, 1 giờ cho KYC)
cloudinary.url(publicId, {
  sign_url: true,
  type: 'authenticated',
  expires_at: Math.floor(Date.now()/1000) + 900,
})
```

### H. Database Index Strategy

> Index là yếu tố quyết định hiệu năng của hệ thống nhiều transaction. Dưới đây là toàn bộ index cần tạo, phân loại theo mức độ ưu tiên.

**🔴 Critical — Bắt buộc trước khi go-live**

| Bảng | Cột / Tổ hợp | Loại | Lý do |
|---|---|---|---|
| `bookings` | `(provider_id, status)` | Composite | NCC query "đơn đang chờ xử lý" — chạy liên tục |
| `bookings` | `(customer_id, status)` | Composite | KH xem lịch sử đơn hàng |
| `bookings` | `(status, auto_completed_at)` | Composite | Cronjob auto-complete quét mỗi giờ |
| `wallet_transactions` | `(wallet_id, created_at DESC)` | Composite | Phân trang lịch sử giao dịch |
| `wallet_transactions` | `vnpay_txn_ref` | Unique | Idempotency check — chống cộng tiền đúp |
| `messages` | `(conversation_id, created_at DESC)` | Composite | Load tin nhắn theo phòng chat |
| `services` | `(provider_id, status, is_deleted)` | Composite | NCC xem danh sách dịch vụ của mình |
| `otp_attempts` | `(email, type)` | Composite | Kiểm tra cooldown và giới hạn OTP |

**🟡 High — Thêm khi có dữ liệu thực**

| Bảng | Cột / Tổ hợp | Loại | Lý do |
|---|---|---|---|
| `services` | `embedding` | `ivfflat` (pgvector) | Vector similarity search — AI gợi ý |
| `services` | `(category_id, status, is_deleted)` | Composite | Lọc dịch vụ theo danh mục |
| `reviews` | `(service_id, created_at DESC)` | Composite | Đọc đánh giá theo dịch vụ |
| `kyc_profiles` | `(status, created_at)` | Composite | Admin duyệt hàng loạt KYC |
| `disputes` | `(status, assigned_to)` | Composite | Staff xem tranh chấp được phân công |
| `notifications` | `(user_id, is_read, created_at DESC)` | Composite | Unread notification badge |
| `refresh_tokens` | `(user_id, revoked)` | Composite | Thu hồi tất cả token khi đổi mật khẩu |
| `audit_logs` | `(actor_id, created_at DESC)` | Composite | Xem lịch sử hành động của Admin/Staff |

**Lưu ý về pgvector index:**
```sql
-- Tạo sau khi có ít nhất 1,000 rows dịch vụ để ivfflat hoạt động hiệu quả
CREATE INDEX ON services USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
-- Cột embedding type: vector(768) — dùng text-embedding-004 (Google Gemini)
-- lists = sqrt(total_rows) là rule of thumb; điều chỉnh khi data tăng
```

---

### I. Quan hệ giữa các bảng (ERD — dạng văn bản)

**Nhóm User & Xác thực**

Bảng `users` là trung tâm của hệ thống. Một user có thể có nhiều `user_addresses`, nhiều `refresh_tokens` (mỗi thiết bị/phiên một token), nhiều `notifications`. Nếu user là Provider thì có thêm một bản ghi `kyc_profiles`, một bản ghi `provider_wallets`, và nhiều `services`.

**Nhóm Dịch vụ**

Mỗi `service` thuộc về một `service_categories` (quan hệ nhiều-một). Danh mục tự tham chiếu qua `parent_id` để tạo cây tối đa 3 cấp. Mỗi dịch vụ có nhiều `service_images`, trong đó ảnh có `display_order = 0` là ảnh bìa.

**Nhóm Booking — trục xương sống**

Một `booking` liên kết ba bảng users: `customer_id`, `provider_id`, và gián tiếp qua `service_id`. Từ một booking có thể phát sinh: một bản ghi `quotations` (báo giá sau khảo sát), nhiều `booking_attachments` (bằng chứng SURVEY và RESULT), nhiều `booking_status_histories` (timeline trạng thái), một `conversations` (phòng chat), một `reviews` (chỉ khi status = DONE), và một `disputes` (nếu KH phản đối).

**Nhóm Tài chính**

`provider_wallets` là ví của NCC (quan hệ một-một với users). Mỗi biến động tiền được ghi vào `wallet_transactions` với `type = DEPOSIT`, `COMMISSION`, hoặc `PENALTY`. Giao dịch COMMISSION có `booking_id` trỏ đến booking gây ra khoản phí; giao dịch DEPOSIT có `booking_id = null`; giao dịch PENALTY phát sinh khi Admin phán quyết tranh chấp theo hướng PENALIZE (trừ tiền phạt NCC). Tỉ lệ hoa hồng không hard-code mà được snapshot từ bảng `commission_configs` tại thời điểm tạo báo giá, lưu vào `quotations.commission_rate_snapshot`.

**Nhóm Chat**

Mỗi `conversations` gắn với một booking (một-một) và chứa hai tham chiếu user: `customer_id` và `provider_id`. Trong conversations có nhiều `messages`; khi `sender_id = 0` và `sender_type = AI` thì tin nhắn đó do AI Chatbot tạo ra.

**Nhóm Tranh chấp**

`disputes` gắn với một booking (một-một). Mỗi tranh chấp có nhiều `dispute_evidences` do các bên upload. Khi tranh chấp được giải quyết, `resolution_action` nhận giá trị COMPLETE (chốt bình thường, NCC đúng) hoặc PENALIZE (KH thắng, phạt NCC bằng cách trừ ví hoặc khóa tài khoản). `bookings.status` vẫn giữ nguyên là DISPUTED — không có status RESOLVED riêng trên booking.

**Bảng hành chính**

`audit_logs` ghi lại mọi hành động của Admin/Staff với `actor_id`, `action`, `target_type`, `target_id`. Bảng này không có foreign key constraint cứng để đảm bảo log không bị mất khi entity bị xóa/khóa.

---

### J. API Contract — Quy ước URL và Swagger

**URL convention:** RESTful chuẩn với prefix `/api/v1`. Tài nguyên dùng danh từ số nhiều, hành động phi CRUD dùng sub-resource hoặc action suffix rõ ràng.

| Pattern | Ví dụ | Ghi chú |
|---|---|---|
| Danh sách | `GET /api/v1/bookings` | Kèm query params: `?status=PENDING&page=1&limit=20` |
| Chi tiết | `GET /api/v1/bookings/:id` | |
| Tạo mới | `POST /api/v1/bookings` | |
| Cập nhật một phần | `PATCH /api/v1/bookings/:id` | Dùng PATCH, không dùng PUT |
| Xóa / hủy | `DELETE /api/v1/bookings/:id` | Hoặc PATCH nếu chỉ đổi status |
| Hành động trên tài nguyên | `POST /api/v1/bookings/:id/confirm` | Các action rõ nghĩa: confirm, cancel, complete, quote |
| Nested resource | `GET /api/v1/bookings/:id/messages` | Chỉ dùng 1 cấp lồng nhau tối đa |
| Admin scope | `GET /api/v1/admin/users` | Prefix `/admin` cho toàn bộ endpoint quản trị |

**Swagger/OpenAPI:** Cài đặt `@nestjs/swagger` ngay khi init project. Mỗi Controller và DTO phải có decorator `@ApiTags`, `@ApiOperation`, `@ApiResponse`. Swagger UI chỉ bật ở môi trường non-production (`NODE_ENV !== 'production'`). Endpoint: `GET /api/docs`.

**Phân trang chuẩn:** Tất cả endpoint trả về danh sách dùng cấu trúc sau để FE có thể render pagination nhất quán.

```typescript
{
  success: true,
  data: {
    items: T[],
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

---

### K. Environment Variables — Danh sách và Validation

Toàn bộ biến môi trường được validate bằng `@nestjs/config` + `Joi` ngay khi app khởi động. Nếu thiếu biến bắt buộc hoặc sai định dạng, app crash với error rõ ràng — không để lỗi âm thầm khi runtime.

**Nhóm App**

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `NODE_ENV` | ✅ | `development` / `staging` / `production` |
| `PORT` | ✅ | Port NestJS lắng nghe (mặc định 3001) |
| `FRONTEND_URL` | ✅ | URL Next.js để cấu hình CORS |
| `JWT_ACCESS_SECRET` | ✅ | Secret ký access token (≥ 32 ký tự) |
| `JWT_REFRESH_SECRET` | ✅ | Secret ký refresh token (≥ 32 ký tự) |
| `JWT_ACCESS_EXPIRES` | ✅ | VD: `15m` |
| `JWT_REFRESH_EXPIRES` | ✅ | VD: `7d` |

**Nhóm Database**

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Neon.tech) |

**Nhóm Redis**

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `REDIS_URL` | ✅ | Upstash Redis URL (dạng `rediss://...`) |

**Nhóm Cloudinary**

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | ✅ | Cloud name |
| `CLOUDINARY_API_KEY` | ✅ | API key |
| `CLOUDINARY_API_SECRET` | ✅ | API secret |

**Nhóm VNPay**

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `VNPAY_TMN_CODE` | ✅ | Terminal code |
| `VNPAY_HASH_SECRET` | ✅ | HMAC secret key |
| `VNPAY_URL` | ✅ | Sandbox hoặc production URL |
| `VNPAY_RETURN_URL` | ✅ | Callback URL sau thanh toán |

**Nhóm Gemini (Google AI Studio)**

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | API key từ Google AI Studio (aistudio.google.com) |
| `GEMINI_MODEL` | ❌ | Mặc định `gemini-2.5-flash` — nhanh, giá rẻ, lý tưởng cho chatbot và intent extraction |
| `GEMINI_EMBEDDING_MODEL` | ❌ | Mặc định `text-embedding-004` — 768 chiều, mới nhất của Google |

**Nhóm Email**

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `GMAIL_USER` | ✅ | Gmail address |
| `GMAIL_APP_PASSWORD` | ✅ | App password (không phải password Gmail thường) |

> **Lưu ý triển khai:** Railway dùng Variables tab để inject. Không bao giờ commit file `.env` lên git. File `.env.example` phải được cập nhật đồng bộ mỗi khi thêm biến mới.

