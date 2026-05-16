<!-- FILE: 00_OVERVIEW.md | SCOPE: Stack · Architecture · Naming · State Machine · TOC -->

# ĐẶC TẢ HỆ THỐNG HOMESERVE — MARKETPLACE DỊCH VỤ TẠI GIA

> **Tác giả:** Lê Văn Nguyên | **Cập nhật:** 04/2026 | **Phiên bản:** 3.0 — Final
> **Mục đích:** Tài liệu đặc tả hệ thống hoàn chỉnh, nhất quán với implementation thực tế.
> **Đọc cùng:** `ARCHITECTURE.md` (quyết định kỹ thuật) · `UXUI.md` (giao diện) · `PROMPTS.md` (hướng dẫn code)

---

## STACK CÔNG NGHỆ THỰC TẾ

| Layer | Technology | Ghi chú |
|---|---|---|
| **Frontend** | Next.js 16.2 App Router | Zustand, Axios, react-hook-form, Tailwind, Shadcn UI |
| **Backend** | NestJS Modular Monolith | Prisma ORM, chỉ Prisma — không dùng TypeORM để query |
| **Database** | PostgreSQL + pgvector | Neon.tech (host), vector search cho AI |
| **Cache / Realtime** | Redis (Upstash) + Socket.io | Rate-limit, OTP cooldown, WS queue |
| **File Storage** | **Cloudinary** | `resource_type: 'auto'` cho cả ảnh/video/PDF |
| **Payment** | VNPay HMAC | Tự code, sandbox NCB |
| **AI** | Google **Gemini 2.5 Flash** + **text-embedding-004** | NestJS proxy — FE không gọi Gemini trực tiếp; vector 768 chiều |
| **Email** | Nodemailer + Gmail SMTP | OTP, thông báo, chào mừng nhân viên |
| **Deploy** | Vercel (FE) + Render (BE) | Free tier; BE dùng cron ping `/health` mỗi 14 phút để giữ server thức khi demo |

> ⚠️ **Quy tắc bắt buộc:** Chỉ dùng Prisma. Package `@nestjs/typeorm` có trong package.json nhưng không được dùng để query hay định nghĩa entity.

---

## KIẾN TRÚC HỆ THỐNG (ARCHITECTURE OVERVIEW)

### Tổng quan các tầng

Hệ thống HomeServe được tổ chức thành ba tầng tách biệt. **Tầng client** là ứng dụng Next.js 16.2 chạy trên Vercel, giao tiếp với backend qua HTTPS cho REST API và WSS cho WebSocket realtime. **Tầng ứng dụng** là một NestJS Modular Monolith chạy trên Render.com, bao gồm 9 module độc lập: Auth, Booking, Wallet, Chat, Service, KYC, Search/AI, Dispute, và Admin. Toàn bộ tầng ứng dụng dùng Prisma ORM để truy vấn DB, BullMQ để xử lý job bất đồng bộ, và Nodemailer để gửi email. **Tầng dữ liệu và dịch vụ ngoài** gồm PostgreSQL với pgvector trên Neon.tech (dữ liệu chính + vector search), Redis trên Upstash (cache, rate-limit, WebSocket queue, circuit breaker), Cloudinary (lưu file ảnh/video/PDF với private URL), và ba dịch vụ bên thứ ba là Gemini (Google AI Studio), VNPay, và Gmail SMTP.

### Luồng xử lý request

**REST API request:** Trình duyệt gửi request qua Next.js, Next.js forward đến NestJS. Tại NestJS, request đi qua JWT Guard xác thực token, Role Guard kiểm tra quyền, rồi vào Controller và xuống Service. Service thực hiện logic nghiệp vụ, gọi Prisma để đọc/ghi PostgreSQL, kiểm tra Redis cho cache và rate-limit nếu cần, rồi trả về response chuẩn `{ success, data }`.

**WebSocket (Chat):** Client thực hiện Socket.io handshake kèm JWT. Server xác thực token ngay tại bước handshake — kết nối không có token hợp lệ bị đóng ngay. Khi có tin nhắn mới, Chat Gateway đồng thời persist tin nhắn vào bảng `messages`, emit event đến cả hai phía trong cùng room, và cập nhật unread count trong Redis. Nếu client mất kết nối, client tự động reconnect với exponential backoff (1s, 2s, 4s, 8s, tối đa 30s); khi reconnect, client gửi `last_message_id` để server đẩy lại các tin nhắn bị miss.

**Async Jobs (BullMQ):** Các tác vụ tốn thời gian — gửi email OTP, cập nhật embedding cho dịch vụ, AI inference không đồng bộ — không xử lý trực tiếp trong request mà được đưa vào queue BullMQ trên Redis. BullMQ Worker xử lý độc lập, retry tối đa 3 lần với exponential backoff (1s, 3s, 9s) nếu thất bại.

### Flow kỹ thuật quan trọng

**Flow 1 — Thanh toán trực tiếp & Hoa hồng NCC (UC14)**

Hệ thống áp dụng mô hình thanh toán trực tiếp: KH thanh toán tiền dịch vụ trực tiếp cho NCC ngoài nền tảng (tiền mặt hoặc chuyển khoản), nền tảng không giữ tiền của KH. Nền tảng chỉ thu hoa hồng từ NCC sau khi đơn hoàn thành.

Để nhận đơn, NCC phải nạp tiền trước vào `provider_wallets` thông qua VNPay. Đây là khoản đặt cọc uy tín — nếu ví âm, NCC bị set `is_restricted = true` và không nhận được đơn mới cho đến khi nạp bù.

Khi đơn chốt thành công (booking `status = DONE` và hết 24h chờ nghiệm thu): hệ thống chạy một transaction duy nhất gồm trừ hoa hồng từ `provider_wallets` theo `commission_rate_snapshot` đã chốt trong báo giá, ghi `wallet_transaction` loại COMMISSION với `booking_id` tham chiếu, và ghi audit log. Nếu số dư sau khi trừ xuống âm, hệ thống vẫn commit nhưng đồng thời set `is_restricted = true`.

Khi tranh chấp được phán quyết là KH thắng (`resolution_action = PENALIZE`): nền tảng không hoàn tiền (vì không giữ tiền KH), thay vào đó trừ thêm một khoản phạt từ ví NCC để đền bù thiệt hại theo quyết định của Admin, hoặc Admin khóa tài khoản NCC vĩnh viễn nếu vi phạm nghiêm trọng. Booking vẫn giữ `status = DISPUTED` — không có status riêng sau phán quyết.

**Flow 2 — Chat Realtime & Scale Multi-node (UC18)**

Trong môi trường single-server hiện tại: khi user A gửi tin nhắn, Socket.io server nhận event, persist tin nhắn vào DB, rồi emit event đến tất cả socket đang subscribe room `conversation:{id}`. Cả user A (để confirm delivered) và user B đều nhận được event này trong cùng một socket server.

Vấn đề khi scale lên multi-node: nếu user A kết nối vào node 1 và user B kết nối vào node 2, node 1 emit event vào room nhưng node 2 không biết — user B sẽ không nhận được tin nhắn. Giải pháp là Socket.io Adapter dùng Redis Pub/Sub: khi node 1 emit, nó publish event vào Redis channel; tất cả node (kể cả node 2) đều subscribe channel đó và forward event xuống các socket client của mình. Từ góc nhìn client, không có gì thay đổi — chỉ là infrastructure thêm một lớp Redis ở giữa. Hiện tại hệ thống chưa triển khai multi-node nhưng kiến trúc Redis đã sẵn sàng để bật adapter khi cần.

### Module boundaries — Phân chia trách nhiệm

| Module | Trách nhiệm chính | Phụ thuộc ngoài |
|---|---|---|
| `auth` | Đăng ký, đăng nhập, OTP, refresh token | Redis (OTP/cooldown), Gmail SMTP |
| `kyc` | Nộp/duyệt hồ sơ KYC | Cloudinary (private), Notification |
| `service` | CRUD dịch vụ, duyệt, AI quét từ khóa | Gemini (embedding), Cloudinary |
| `booking` | Tạo đơn → báo giá → thực hiện → nghiệm thu | Notification, Wallet, Chat |
| `wallet` | Ví NCC, nạp tiền, trừ hoa hồng | VNPay IPN, BullMQ |
| `chat` | WebSocket, tin nhắn, AI chatbot | Socket.io, Redis, Gemini |
| `search` | Vector search + AI gợi ý | pgvector, Gemini |
| `dispute` | Khiếu nại, phân xử, phán quyết | Wallet, Notification, Audit |
| `admin` | Dashboard, cấu hình, báo cáo | Tất cả module |

---

## NAMING CONVENTION — FIELD DB THỰC TẾ

> Đây là nguồn sự thật. Dùng đúng tên khi code, đừng đoán mò.

| Bảng | Field | Ghi chú |
|---|---|---|
| `users` | `full_name`, `status: ACTIVE/LOCKED/PENDING`, `email_verified` | Không có `name`, `isLocked`, `deletedAt` |
| `bookings` | `booking_code`, `surveyor_name`, `completed_at`, `auto_completed_at` | `completed_at` = NCC bấm DONE (bắt đầu 24h chờ); `auto_completed_at` = hệ thống tự chốt sau 24h |
| `quotations` | `actual_price`, `commission_rate_snapshot *(quotations table)*` | Snapshot tại thời điểm tạo báo giá |
| `provider_wallets` | `is_restricted` | Không có bảng `wallets` chung |
| `wallet_transactions` | `type: DEPOSIT \| COMMISSION` | Không phải `COMMISSION_DEDUCTION` |
| `disputes` | `status: PENDING → IN_REVIEW → RESOLVED`, `resolution_action: COMPLETE \| PENALIZE` | |
| `service_categories` | `is_deleted BOOLEAN` | Soft delete duy nhất — không phải `deletedAt` |
| `services` | `is_deleted BOOLEAN`, `status: DRAFT/PENDING/ACTIVE/HIDDEN/REJECTED` | |
| `messages` | `sender_type: CUSTOMER \| PROVIDER \| AI` | Enum thực tế trong DB |

---

## BOOKING STATUS MACHINE — THỰC TẾ DB

> ⚠️ **Không có status COMPLETED hay REFUNDED.** Đây là điểm hay bị hiểu nhầm nhất.

```
PENDING → QUOTED → CONFIRMED → IN_PROGRESS → DONE ─────────────► DONE + auto_completed_at
                                    │             │                    (= "hoàn thành")
                               KH khiếu nại   Customer phản đối
                                    │             │
                                    └──────────────┘
                                         DISPUTED
                                             │
                               Admin cập nhật disputes.status = RESOLVED
                               disputes.resolution_action = COMPLETE | PENALIZE
                               (booking vẫn giữ status = DISPUTED)
```

> KH được phép mở tranh chấp từ cả hai trạng thái `IN_PROGRESS` (thợ bỏ về ngang) và `DONE` (không đồng ý nghiệm thu). Xem chi tiết tại UC17.1.

**Logic chốt đơn:**
- "Hoàn thành" = booking `status = DONE` AND (`completed_at IS NOT NULL` OR `auto_completed_at IS NOT NULL`)
- Cronjob kiểm tra: `auto_completed_at = completed_at + 24h` → nếu đến giờ và KH chưa phản đối → hệ thống tự chốt
- Không bao giờ dùng `WHERE status = 'COMPLETED'` — status đó không tồn tại

**Soft delete:**
- Chỉ `service_categories` và `services` dùng `is_deleted BOOLEAN`
- Booking, wallet, message: không xóa, không có soft delete field (data tài chính/pháp lý)
- User "xóa": Admin set `status = LOCKED` hoặc đặt `email = DELETED_{id}`

**Xử lý user bị LOCKED tại tầng Service:**

Khi tài khoản bị khóa (`status = LOCKED`), JWT hiện tại của user vẫn còn hiệu lực về mặt chữ ký cho đến khi hết TTL (tối đa 30 phút). Vì vậy chỉ chặn ở tầng Auth là chưa đủ — cần bổ sung guard ở tầng Service cho mọi thao tác "write". Quy tắc cụ thể:

Tại các API endpoint có hành động ghi (tạo booking, gửi tin nhắn, nộp KYC, tạo dịch vụ, gửi báo giá...), sau khi JWT Guard xác thực token hợp lệ, Service layer phải thực hiện thêm bước kiểm tra `users.status = ACTIVE` trước khi tiến hành logic nghiệp vụ. Nếu `status = LOCKED` → throw `ForbiddenException` với code `ACCOUNT_LOCKED`. Nếu `status = PENDING` (chưa xác thực email) → throw với code `EMAIL_NOT_VERIFIED`.

Các thao tác đọc (xem lịch sử booking, xem tin nhắn cũ) vẫn cho phép với tài khoản LOCKED để người dùng có thể tra cứu lịch sử của mình. Việc thu hồi token ngay lập tức được xử lý song song bằng cách revoke toàn bộ `refresh_tokens` của user và thêm JWT ID vào Redis blacklist — nhưng vẫn cần guard tầng Service như trên vì blacklist Redis có thể có độ trễ hoặc miss trong edge case.

---

## MỤC LỤC

1. [Kiến trúc hệ thống](#architecture)
2. [Yêu cầu phi chức năng (NFR)](#nfr)
3. [Kịch bản lỗi & Failure Scenarios](#failure-scenarios)
4. [Actors & Phân quyền](#actors)
5. [UC01 – Đăng ký tài khoản](#uc01)
6. [UC02 – Đăng nhập, đăng xuất, quên mật khẩu](#uc02)
7. [UC03 – Quản lý hồ sơ cá nhân](#uc03)
8. [UC04 – Quản lý danh mục dịch vụ](#uc04)
9. [UC05 – Duyệt và quản lý dịch vụ](#uc05)
10. [UC06 – Quản lý tài khoản người dùng và KYC](#uc06)
11. [UC07 – Quản lý tài khoản nhân viên](#uc07)
12. [UC08 – Quản lý booking toàn hệ thống](#uc08)
13. [UC09 – Xử lý khiếu nại và tranh chấp](#uc09)
14. [UC10 – Báo cáo, thống kê và cấu hình](#uc10)
15. [UC11 – Quản lý dịch vụ cá nhân (NCC)](#uc11)
16. [UC12 – Quản lý booking và báo giá (NCC)](#uc12)
17. [UC13 – Báo cáo cá nhân (NCC)](#uc13)
18. [UC14 – Quản lý ví nhà cung cấp](#uc14)
19. [UC15 – Tìm kiếm và AI Recommendation](#uc15)
20. [UC16 – Quản lý booking (Khách hàng)](#uc16)
21. [UC17 – Đánh giá và tranh chấp (Khách hàng)](#uc17)
22. [UC18 – Chat và AI Chatbot](#uc18)
23. [UC19 – Thông báo sự kiện](#uc19)
24. [Đề xuất cải thiện](#de-xuat)

**Phụ lục:**
- [A. Prisma Enums](#a-prisma-schema--enum-thực-tế)
- [B. Transaction Boundaries](#b-transaction-boundaries-prismatransaction)
- [C. Caching Strategy (Redis)](#c-caching-strategy-redis--upstash)
- [D. API Response Standard](#d-api-response-standard)
- [E. Cronjob Registry](#e-cronjob-registry)
- [F. AI Pipeline & Re-ranking Weights](#f-ai-pipeline--quyết-định-đã-cam-kết)
- [G. File Upload — Cloudinary](#g-file-upload--cloudinary)
- [H. Database Index Strategy](#h-database-index-strategy)
- [I. Quan hệ giữa các bảng (ERD)](#i-quan-hệ-giữa-các-bảng-erd--dạng-văn-bản)
- [J. API Contract — Quy ước URL và Swagger](#j-api-contract--quy-ước-url-và-swagger)
- [K. Environment Variables](#k-environment-variables--danh-sách-và-validation)

---

