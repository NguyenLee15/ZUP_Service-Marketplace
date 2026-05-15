# ARCHITECTURE.md — Tài Liệu Kiến Trúc Dự Án

> **Mục đích:** Tài liệu này là nguồn sự thật duy nhất (single source of truth) cho toàn bộ dự án. Bất kỳ ai đọc file này đều phải nắm được: stack, cấu trúc thư mục, luồng trạng thái, quy tắc bảo mật và cách triển khai — trước khi viết một dòng code.

---

## Mục lục

1. [Stack Công Nghệ & Hạ Tầng](#1-stack-công-nghệ--hạ-tầng)
2. [ORM — Làm rõ Prisma vs TypeORM](#2-orm--làm-rõ-prisma-vs-typeorm)
3. [Roles & Phân Quyền](#3-roles--phân-quyền)
4. [Nguyên Tắc Bảo Mật & Logic Lõi](#4-nguyên-tắc-bảo-mật--logic-lõi)
5. [State Machine — Booking](#5-state-machine--booking)
6. [State Machine — Dịch Vụ (Service)](#6-state-machine--dịch-vụ-service)
7. [State Machine — KYC](#7-state-machine--kyc)
8. [Wallet & Payment Flow](#8-wallet--payment-flow)
9. [Cronjob Registry](#9-cronjob-registry)
10. [Cấu Trúc Mã Nguồn Backend (NestJS)](#10-cấu-trúc-mã-nguồn-backend-nestjs)
11. [Cấu Trúc Mã Nguồn Frontend (Next.js)](#11-cấu-trúc-mã-nguồn-frontend-nextjs)
12. [File Cốt Lõi: Axios Interceptor](#12-file-cốt-lõi-axios-interceptor)
13. [Chiến Lược Triển Khai](#13-chiến-lược-triển-khai)
14. [Nguyên Tắc Toàn Cục Khi Code](#14-nguyên-tắc-toàn-cục-khi-code)
15. [API Response Standard & Error Handling](#15-api-response-standard--error-handling)
16. [Transaction Boundary](#16-transaction-boundary)
17. [Caching Strategy](#17-caching-strategy)
18. [Logging & Observability](#18-logging--observability)
19. [AI Fallback Strategy](#19-ai-fallback-strategy)
20. [File & Folder Convention](#20-file--folder-convention)
21. [Code Quality Checklist](#21-code-quality-checklist)

---

## 1. Stack Công Nghệ & Hạ Tầng

| Phân lớp | Công nghệ cốt lõi | Thư viện & Dịch vụ | Mục đích / Điểm nhấn |
| :--- | :--- | :--- | :--- |
| **Frontend** | **Next.js 16.2** (App Router) | `zustand`, `axios`, `react-hook-form`, `recharts`, `react-leaflet`, `react-dropzone`, `ai` (Vercel AI SDK) | Giao diện người dùng, bản đồ chọn vị trí, kéo-thả upload file, nhận AI Streaming. |
| **Backend** | **NestJS** (Modular Monolith) | `@nestjs/typeorm`, `pg`, `socket.io`, `@nestjs/schedule`, `ioredis` | Logic nghiệp vụ, proxy gọi AI, Cronjob tự động, tự code VNPay HMAC. |
| **Database** | **PostgreSQL** + `pgvector` | **Prisma** (ORM chính), Neon.tech (host) | Lưu trữ dữ liệu quan hệ và Vector Embeddings cho AI Semantic Search. |
| **Cache & Realtime** | **Redis** | Upstash Redis (serverless) | Rate-limiting OTP/login, quản lý hàng đợi Socket, TTL brute-force lock. |
| **3rd Party** | Cloudinary, VNPay, Gmail SMTP | OpenAI `gpt-4o-mini`, Sandbox NCB, Nodemailer | Lưu Media (`resource_type: 'auto'`), thanh toán, gửi OTP/email, AI chatbot. |

---

## 2. ORM — Làm rõ Prisma vs TypeORM

> ⚠️ **Chỉ dùng Prisma.** Package `@nestjs/typeorm` có trong `package.json` nhưng **không được sử dụng** để định nghĩa entity hay query.

| Việc cần làm | Dùng cái gì |
| :--- | :--- |
| Định nghĩa schema, migrate DB | `prisma/schema.prisma` + `prisma migrate dev` |
| Query dữ liệu trong service | `PrismaService` (inject vào NestJS module) |
| Raw query (pgvector, phức tạp) | `prisma.$queryRaw` |

---

## 3. Roles & Phân Quyền

Hệ thống có **4 roles** cố định, được lưu trong JWT payload và kiểm tra bởi `@Roles()` decorator + `RolesGuard`.

| Role | Mô tả | Điều kiện bổ sung |
| :--- | :--- | :--- |
| `CUSTOMER` | Khách hàng tìm kiếm, đặt lịch | Email đã xác thực |
| `PROVIDER` | Nhà cung cấp dịch vụ | Email xác thực **+ KYC đã duyệt** mới tạo được dịch vụ |
| `STAFF` | Nhân viên hệ thống | Duyệt dịch vụ, xem KYC |
| `ADMIN` | Quản trị viên | Toàn quyền, phân xử tranh chấp, quản lý danh mục |

**Tenant Isolation (bắt buộc):** Mọi query liên quan đến dữ liệu riêng tư (booking, dịch vụ, ví) PHẢI filter thêm `where: { userId: currentUser.id }` hoặc `providerId`. Không bao giờ trả về dữ liệu của người khác.

---

## 4. Nguyên Tắc Bảo Mật & Logic Lõi

### 4.1 Authentication (JWT)

- **Access Token**: thời hạn ngắn (15–30 phút), lưu trong memory (Zustand store).
- **Refresh Token**: thời hạn dài, lưu trong `httpOnly cookie`. Xóa khỏi DB khi logout → không cần Redis blacklist, tiết kiệm chi phí.
- **Brute-force**: sai mật khẩu 5 lần liên tiếp → khóa tài khoản 15 phút, dùng Redis TTL để tự mở lại.

### 4.2 OTP (Đăng ký / Quên mật khẩu)

| Tham số | Giá trị |
| :--- | :--- |
| Độ dài OTP | 6 chữ số |
| Hiệu lực | 10 phút |
| Cooldown gửi lại | 60 giây |
| Giới hạn gửi/ngày | 5 lần/email |
| Giới hạn nhập sai | 5 lần → khóa 15 phút |
| Bảo vệ spam | reCAPTCHA ẩn trước khi gọi API gửi mail |

> Tài khoản **chỉ được tạo** sau khi OTP hợp lệ. Không tạo trước rồi xác thực sau.

### 4.3 WebSocket

`WsGuard` xác thực token từ `handshake.headers.authorization` trước khi cho phép join room chat/notification. Không có token hợp lệ → disconnect ngay.

### 4.4 AI Proxy

NestJS đứng giữa làm proxy: ẩn OpenAI API Key, nhận Stream từ OpenAI và pipe về Next.js. Frontend **không bao giờ** gọi trực tiếp OpenAI.

- **Semantic Search**: pgvector → Fallback về `LIKE` query nếu AI timeout (> 5 giây).
- **Chatbot RAG**: inject mô tả dịch vụ vào system prompt, chỉ trả lời dựa trên dữ liệu đó. Không cam kết giá, không chốt lịch thay provider.

### 4.5 Soft Delete — Quy tắc theo DB thực tế

> ⚠️ **Không phải toàn hệ thống dùng `deletedAt`.** DB schema thực tế dùng hai cơ chế khác nhau tùy bảng.

| Bảng | Cơ chế | Field |
| :--- | :--- | :--- |
| `service_categories` | `is_deleted BOOLEAN` | `@map("is_deleted")` |
| `services` | `is_deleted BOOLEAN` | `@map("is_deleted")` |
| Tất cả bảng còn lại | Không có soft delete | — |

**Lý do thiết kế như vậy:**
- Danh mục và dịch vụ cần ẩn khỏi UI nhưng vẫn giữ cho audit — dùng `is_deleted`.
- Booking, wallet, message... là data tài chính/pháp lý — không xóa, không cần cờ vì không ai được xóa.
- User bị xóa: chỉ Admin dùng và là hành động hiếm — xử lý qua `status: LOCKED` hoặc soft delete bằng cách đặt `email = DELETED_{id}`.

**Khi code query:**
```typescript
// service_categories và services: luôn filter is_deleted
await prisma.service.findMany({ where: { isDeleted: false } })

// Các bảng khác: không cần filter — không có soft delete field
await prisma.booking.findMany({ where: { customerId } })
```

---

## 5. State Machine — Booking

> **Quan trọng:** Đây là luồng phức tạp nhất. Đọc kỹ trước khi code `bookings` module.

### 5.1 Sơ đồ trạng thái

```
[Tạo mới] ──────────────────────────────► PENDING (Chờ xác nhận)
                                              │
                    ┌─────────────────────────┤
                    │                         │
              Provider/Customer hủy     Provider nhập người
                    │                   khảo sát (UC12.2)
                    ▼                         │ ← trạng thái KHÔNG đổi
                CANCELLED              (vẫn là PENDING)
                                              │
                                   Provider gửi báo giá (UC12.3)
                                              │
                                              ▼
                                         QUOTED (Đã báo giá)
                                              │
                    ┌─────────────────────────┤
                    │                         │
          Customer từ chối /         Customer đồng ý (UC16.3)
          Provider hủy                        │
                    │                         ▼
                    ▼                    CONFIRMED (Đã xác nhận)
                CANCELLED                     │
                                   Provider bắt đầu (UC12.4)
                                              │
                                              ▼
                                      IN_PROGRESS (Đang thực hiện)
                                              │
                                   Provider báo xong + upload ảnh (UC12.4)
                                              │
                                              ▼
                                       DONE (Hoàn thành - chờ nghiệm thu)
                                              │
                    ┌─────────────────────────┤
                    │                         │
             Customer phản đối     Customer xác nhận → ghi completedAt
             (UC17.2)              HOẶC quá 24h → Cronjob ghi autoCompletedAt
                    │                         │
                    ▼                         ▼
                DISPUTED                 DONE + completedAt/autoCompletedAt
           (Có tranh chấp)          → Hệ thống trừ hoa hồng provider_wallets
                    │
           Admin phán quyết (UC09.2)
           cập nhật disputes.status = RESOLVED
           disputes.resolutionAction = COMPLETE | REFUND
           (Booking vẫn giữ status DISPUTED)
```
> ⚠️ **DB không có status COMPLETED hay REFUNDED.** "Chốt đơn" = booking status `DONE` + `autoCompletedAt IS NOT NULL`. Kiểm tra logic nghiệp vụ dựa trên timestamp, không dựa trên status.

### 5.2 Bảng chuyển trạng thái

| Từ | Sự kiện | Sang | Ai kích hoạt | UC |
| :--- | :--- | :--- | :--- | :--- |
| `PENDING` | Provider nhập info người khảo sát | `PENDING` *(không đổi)* | Provider | UC12.2 |
| `PENDING` | Provider gửi báo giá | `QUOTED` | Provider | UC12.3 |
| `PENDING` | Provider hoặc Customer hủy | `CANCELLED` | Provider/Customer | UC12.5, UC16.4 |
| `QUOTED` | Customer đồng ý báo giá | `CONFIRMED` | Customer | UC16.3 |
| `QUOTED` | Customer từ chối hoặc Provider hủy | `CANCELLED` | Customer/Provider | UC16.3 AF, UC12.5 |
| `CONFIRMED` | Provider bắt đầu thực hiện | `IN_PROGRESS` | Provider | UC12.4 |
| `IN_PROGRESS` | Provider báo hoàn thành + ảnh | `DONE` | Provider | UC12.4 |
| `DONE` | Customer xác nhận nghiệm thu | `DONE` + ghi `completedAt` | Customer | UC17.2 |
| `DONE` | Quá 24h không có phản hồi | `DONE` + ghi `autoCompletedAt` | **Cronjob** | UC17.2 AF1.2 |
| `DONE` | Customer phản đối | `DISPUTED` | Customer | UC17.2 AF1.1 |
| `DISPUTED` | Admin phán quyết OK | `DISPUTED` + `disputes.status=RESOLVED` | Admin | UC09.2 |
| `DISPUTED` | Admin phán quyết hoàn tiền | `DISPUTED` + `disputes.status=RESOLVED` | Admin | UC09.2 |

> **Lưu ý quan trọng — DB không có trạng thái COMPLETED/REFUNDED:**
> - "Chốt đơn thành công" = booking vẫn là `DONE` + `autoCompletedAt IS NOT NULL`
> - "Tranh chấp được giải quyết" = booking vẫn là `DISPUTED` + `disputes.status = RESOLVED`
> - Trừ hoa hồng xảy ra khi: `completedAt` được ghi (customer confirm) HOẶC `autoCompletedAt` được ghi (cronjob)
> - Lịch sử chuyển trạng thái đầy đủ lưu trong bảng `booking_status_histories`

### 5.3 Quy tắc quan trọng

- **Sau `CONFIRMED`**: Provider **không thể tự hủy**. Phải dùng luồng tranh chấp (UC09).
- **Snapshot hoa hồng**: Khi gửi báo giá (`QUOTED`), lưu `commission_rate_snapshot` vào bảng `quotations`. Khi trừ tiền, đọc từ đó — **không dùng config hiện tại** để tránh ảnh hưởng hồi tố.
- **Chốt đơn**: Xác định qua `completedAt` (customer confirm) hoặc `autoCompletedAt` (cronjob). Booking vẫn ở trạng thái `DONE`.
- **Trạng thái `DISPUTED`**: Tiền hoa hồng bị **treo**, không trừ. Chờ Admin phán quyết qua bảng `disputes`.
- **Ghi nợ âm**: Khi trừ hoa hồng, nếu ví Provider không đủ, vẫn trừ (ghi nợ âm) + set `provider_wallets.is_restricted = true`.
- **Lịch sử**: Mọi thay đổi trạng thái đều ghi vào `booking_status_histories` với `changedBy` và `note`.

---

## 6. State Machine — Dịch Vụ (Service)

```
[Provider tạo mới]
        │
   ┌────┴────┐
   │         │
Lưu nháp   Gửi duyệt
   │         │
   ▼         ▼
 DRAFT    PENDING (Chờ duyệt — DB enum là PENDING)
              │
   ┌──────────┤
   │          │
Admin từ chối  Admin duyệt
   │          │
   ▼          ▼
REJECTED   ACTIVE (Đang hoạt động)
   │          │
Provider      │ ◄─────────────────────────────┐
sửa + gửi     │                               │
lại ──► PENDING                    Provider tự ẩn (UC11.4)
              │                               │
              │                               ▼
              └──── Admin ẩn ────────► HIDDEN (Bị ẩn)
                    (UC05.3)          (Provider có thể kích hoạt lại)
```

**Quy tắc quan trọng:**

| Sự kiện | Kết quả | Nguồn |
| :--- | :--- | :--- |
| Provider update dịch vụ `ACTIVE` | Tự động chuyển về `PENDING` | UC11.3 BR2 |
| Provider update dịch vụ `REJECTED` | Tự động chuyển về `PENDING` | UC11.3 BR3 |
| Provider update dịch vụ `DRAFT` hoặc `HIDDEN` | Giữ nguyên trạng thái | UC11.3 BR4 |
| Điểm TB < 2.0 sao **hoặc** ≥ 3 tranh chấp trong 30 ngày | Tự động ẩn (Cronjob) | UC05.3 BR2 |
| Dịch vụ `HIDDEN`/`REJECTED` | Không xuất hiện trong search, AI gợi ý | UC05.4, UC15.3 |

---

## 7. State Machine — KYC

```
[Chưa nộp]
     │
     ▼
PENDING (Chờ duyệt — bảng kyc_profiles, field status=PENDING)
     │
┌────┴────┐
│         │
Admin      Admin
duyệt      từ chối (kèm lý do)
│         │
▼         ▼
APPROVED  REJECTED
          │
     Provider sửa
     và nộp lại
          │
          ▼
      PENDING
```

**Quy tắc:** Provider chỉ có thể tạo/sửa dịch vụ khi `kyc_profiles.status = APPROVED`. Không được phép nộp đúp khi đang `PENDING`.

---

## 8. Wallet & Payment Flow

### 8.1 Nạp tiền (VNPay)

```
Provider chọn mệnh giá
        │
        ▼
BE tạo vnp_TxnRef + redirect URL
        │
        ▼
VNPay xử lý thanh toán
        │
   ┌────┴────┐
   │         │
IPN callback  ReturnUrl
(xử lý tiền)  (chỉ hiển thị UI)
   │
   ▼
BE xác thực vnp_SecureHash (HMAC-SHA512)
   │
   ▼
Transaction lock (chống double-spending)
   │
   ▼
Cộng số dư ví + lưu lịch sử
   │
   ▼
Nếu ví từng âm → tự động gỡ flag RESTRICTED
```

> **Nguyên tắc cứng:** Tuyệt đối **không cộng tiền ở `ReturnUrl`**. ReturnUrl chỉ redirect và hiển thị kết quả.

### 8.2 Trừ hoa hồng (khi Booking COMPLETED)

```
Booking chuyển sang COMPLETED
        │
        ▼
Đọc commission_rate từ bảng quotes (snapshot — không dùng config hiện tại)
        │
        ▼
amount = finalPrice * commission_rate
        │
        ▼
Trừ ví Provider (dù âm vẫn trừ, ghi nợ)
        │
   ┌────┴────┐
   │         │
Ví >= 0    Ví < 0
   │         │
   ▼         ▼
 Done     Set RESTRICTED trên account
          Ẩn toàn bộ dịch vụ
          Gửi thông báo yêu cầu nạp tiền
```

### 8.3 Các loại giao dịch ví

| Loại | Ký hiệu | Màu | Bắt buộc có |
| :--- | :--- | :--- | :--- |
| Nạp tiền | `+` | Xanh lá | — |
| Trừ hoa hồng | `−` | Đỏ | Link tới booking ID |

---

## 9. Cronjob Registry

> Tất cả cronjob được đăng ký trong `@nestjs/schedule`. File tập trung: `src/modules/scheduler/scheduler.service.ts`.

| Tên Job | Chu kỳ | Mục đích | UC/BR liên quan |
| :--- | :--- | :--- | :--- |
| `autoCompleteBookings` | Mỗi 5 phút | Tự động chuyển booking `DONE` → `COMPLETED` nếu quá 24h không nghiệm thu | UC17.2 AF1.2 |
| `autoHideViolatingServices` | Hằng ngày (02:00) | Ẩn dịch vụ có điểm TB < 2.0 sao hoặc ≥ 3 tranh chấp trong 30 ngày | UC05.3 BR2 |
| `remindAdminPendingServices` | Mỗi giờ | Gửi thông báo cho Admin về dịch vụ chờ duyệt > 20h | UC05.1 AF1.3 |
| `remindCustomerAcceptance` | Mỗi 15 phút | Gửi thông báo nhắc nhở khách khi còn 6h để nghiệm thu | UC17.2 Other |

> **Lưu ý Redis TTL (không phải cronjob):** Mở khóa brute-force sau 15 phút được xử lý bởi Redis TTL tự hết hạn — không cần job riêng.

---

## 10. Cấu Trúc Mã Nguồn Backend (NestJS)

```
src/
├── main.ts                          # Khởi động server, global pipes/filters
├── app.module.ts                    # Root module
│
├── common/                          # Tài nguyên dùng toàn bộ app
│   ├── decorators/
│   │   ├── current-user.decorator.ts  # @CurrentUser() → lấy user từ JWT
│   │   └── roles.decorator.ts         # @Roles(Role.ADMIN)
│   ├── filters/
│   │   └── all-exceptions.filter.ts   # Chuẩn hoá format lỗi toàn app
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── ws.guard.ts                # Guard cho WebSocket handshake
│   ├── interceptors/
│   │   └── transform.interceptor.ts   # Wrap response { data, statusCode, message }
│   └── utils/
│       ├── hash.util.ts               # bcrypt
│       └── generate.util.ts           # tạo OTP, token ngẫu nhiên
│
├── config/                            # Đọc .env, validate bằng Joi
│   ├── app.config.ts                  # PORT, NODE_ENV
│   ├── database.config.ts             # DATABASE_URL (Prisma)
│   ├── vnpay.config.ts                # VNPAY_TMN_CODE, VNPAY_HASH_SECRET
│   └── cloudinary.config.ts           # CLOUDINARY_API_KEY, ...
│
├── shared/                            # Module tiện ích inject vào các module khác
│   ├── mail/                          # Nodemailer: gửi OTP, thông báo
│   ├── cloudinary/                    # Upload ảnh/file (resource_type: 'auto')
│   ├── redis/                         # Rate-limit, TTL brute-force
│   └── ai/                            # Gọi OpenAI SDK, streaming proxy
│
├── prisma/                            # Prisma service (singleton)
│   └── prisma.service.ts
│
└── modules/                           # Nghiệp vụ chính
    ├── auth/          # Đăng ký, đăng nhập, refresh token, OTP, reCAPTCHA
    ├── users/         # Hồ sơ cá nhân, KYC (nộp + duyệt), địa chỉ thường dùng
    ├── categories/    # Quản lý danh mục (CRUD, soft delete, cây 3 cấp)
    ├── services/      # Dịch vụ marketplace (CRUD, duyệt, ẩn/hiện, pgvector embed)
    ├── bookings/      # Toàn bộ luồng đặt lịch (xem State Machine mục 5)
    ├── quotations/    # Báo giá, snapshot commission_rate_snapshot (tên bảng là quotations)
    ├── provider-wallets/ # Ví nội bộ, lịch sử giao dịch, IPN VNPay (tên bảng là provider_wallets)
    ├── chats/         # Socket.io real-time chat, AI Chatbot khi Provider offline
    ├── reviews/       # Đánh giá 1–5 sao (chỉ khi booking DONE + autoCompletedAt IS NOT NULL)
    ├── disputes/      # Khiếu nại, upload bằng chứng, Admin phán quyết
    ├── notifications/ # Push thông báo real-time qua WebSocket
    ├── scheduler/     # Tập trung toàn bộ Cronjob (xem mục 9)
    └── audit-logs/    # Lưu vết mọi hành động Admin/Staff
```

---

## 11. Cấu Trúc Mã Nguồn Frontend (Next.js)

```
src/
├── app/                               # App Router — Routing & Pages
│   ├── (main)/                        # Nhóm Khách hàng
│   │   ├── search/                    # Tìm kiếm dịch vụ (UC15)
│   │   ├── services/[id]/             # Chi tiết dịch vụ (UC15.2)
│   │   ├── bookings/                  # Quản lý booking cá nhân (UC16)
│   │   ├── chat/                      # Nhắn tin (UC18)
│   │   └── profile/                   # Hồ sơ, địa chỉ (UC03)
│   │
│   ├── (provider)/                    # Nhóm Nhà cung cấp
│   │   ├── dashboard/                 # Tổng quan
│   │   ├── kyc/                       # Nộp/xem trạng thái KYC (UC01.2)
│   │   ├── services/                  # Quản lý dịch vụ (UC11)
│   │   ├── bookings/                  # Quản lý đặt lịch (UC12)
│   │   ├── wallet/                    # Ví nội bộ (UC14)
│   │   └── reports/                   # Báo cáo doanh thu (UC13)
│   │
│   ├── (admin)/                       # Nhóm Quản trị
│   │   ├── kyc/                       # Duyệt KYC
│   │   ├── services/                  # Duyệt dịch vụ (UC05)
│   │   ├── categories/                # Quản lý danh mục (UC04)
│   │   └── disputes/                  # Phân xử tranh chấp (UC09)
│   │
│   ├── (auth)/                        # Nhóm Xác thực
│   │   ├── login/                     # UC02.1
│   │   ├── register/                  # UC01.1
│   │   └── forgot-password/           # UC02.3
│   │
│   ├── api/
│   │   └── chat/route.ts              # Route ẩn cho AI Streaming (không expose key)
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                            # Shadcn UI primitives
│   ├── shared/                        # Navbar, Sidebar, NotificationBell
│   └── features/                      # UI theo domain
│       ├── booking/
│       ├── chat/
│       ├── wallet/
│       └── vnpay/
│
├── lib/
│   ├── axios.ts                       # Interceptor token + queue 401 (xem mục 12)
│   ├── socket.ts                      # Khởi tạo Socket.io client (singleton)
│   └── utils.ts                       # cn() tailwind merge, formatCurrency()
│
├── hooks/
│   ├── use-auth.ts                    # Login/Logout logic
│   ├── use-socket.ts                  # Connect/Disconnect WebSocket
│   └── use-chat-logic.ts              # Vercel AI useChat hook
│
├── store/                             # Zustand stores
│   ├── auth.store.ts                  # { user, accessToken, refreshToken, setTokens, logout }
│   ├── notification.store.ts          # { notifications[], addNotification, markRead }
│   └── booking.store.ts               # Cache trạng thái đơn hiện tại
│
└── types/
    └── *.type.ts                      # Enum BookingStatus, ServiceStatus, Role, ...
```

---

## 12. File Cốt Lõi: Axios Interceptor

**Mục đích:** Tự động đính kèm Access Token, xử lý 401 không bị race condition, queue các request bị lỗi và retry sau khi refresh token thành công.

```typescript
// src/lib/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/auth.store';

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// 1. Tự động đính kèm Access Token
instance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 2. Xử lý 401 + Queue các request bị chặn
instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Nếu đang refresh rồi → đưa vào hàng đợi, đợi token mới
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return instance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken },
        );

        const newAccessToken = data.accessToken;
        useAuthStore.getState().setTokens(newAccessToken, data.refreshToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return instance(originalRequest);
      } catch (err) {
        processQueue(err as AxiosError, null);
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default instance;
```

---

## 13. Chiến Lược Triển Khai

| Service | Platform | Lý do |
| :--- | :--- | :--- |
| Frontend | **Vercel** | CI/CD tự động từ GitHub, zero-config với Next.js |
| Backend | **Render.com** | Dễ setup, free tier đủ cho đồ án; dùng cron ping `/health` mỗi 14 phút để giữ server thức trong tuần bảo vệ |
| Database | **Neon.tech** | PostgreSQL serverless, hỗ trợ pgvector extension |
| Cache | **Upstash Redis** | Serverless Redis, free tier đủ cho đồ án |
| Media | **Cloudinary** | Free tier 25GB, hỗ trợ `resource_type: 'auto'` cho cả ảnh và PDF |

---

## 14. Nguyên Tắc Toàn Cục Khi Code

> Những quy tắc này áp dụng **xuyên suốt** — không có ngoại lệ.

1. **Soft Delete — theo đúng DB schema:**
   - `service_categories` và `services`: dùng `is_deleted = true` (BOOLEAN).
   - Tất cả bảng còn lại: không có soft delete field — không gọi `.delete()` nhưng cũng không có `deletedAt`.
   - Không được tự ý thêm `deletedAt` vào bảng không có trong schema.

2. **Tenant Isolation:** Mọi query dữ liệu nhạy cảm phải kèm điều kiện `userId` hoặc `providerId` của người đang đăng nhập. Kiểm tra ở service layer, không chỉ ở controller.

3. **Snapshot tài chính:** Khi tạo báo giá, lưu `commissionRateSnapshot` vào bảng `quotations` tại thời điểm gửi. Khi trừ hoa hồng, đọc từ `quotations.commissionRateSnapshot` — không bao giờ query lại từ `commission_configs`.

4. **IPN là nguồn sự thật duy nhất:** Mọi logic cộng/trừ tiền chỉ xảy ra ở IPN endpoint, không ở ReturnUrl hay bất kỳ nơi nào khác.

5. **Không để lộ thông tin qua error message:** Lỗi đăng nhập luôn trả `"Email hoặc mật khẩu không đúng"`. Không phân biệt email sai hay mật khẩu sai. Tương tự với quên mật khẩu.

6. **AI Timeout = 5 giây:** Mọi request đến OpenAI phải có timeout 5s. Quá thời gian → fallback ngay, không chờ.

7. **Idempotency cho payment:** API IPN của VNPay phải kiểm tra `vnp_TxnRef` đã xử lý chưa trước khi cộng tiền. Dùng DB transaction lock.

8. **Chat log bất biến:** Không cho phép xóa hoặc sửa tin nhắn đã gửi. Là bằng chứng pháp lý trong tranh chấp.

9. **Tuân thủ contract API:** Mọi response thành công và lỗi phải theo đúng format mục 15. FE dựa vào `error.code` để handle UI, không parse `message`.

10. **Transaction cho critical flow:** Mọi operation chạm ≥ 2 bảng quan trọng phải bọc trong `prisma.$transaction()`. Xem danh sách tại mục 16. Đặc biệt: trừ hoa hồng phải atomic trên `provider_wallets` + `wallet_transactions`.

---

## 15. API Response Standard & Error Handling

> **Mục đích:** FE (Axios interceptor + UI layer) cần một contract cố định để handle lỗi mà không phải đoán format. Mọi endpoint đều trả về đúng hai shape dưới đây.

### 15.1 Success Response

```typescript
// HTTP 200 / 201
{
  "success": true,
  "data": <payload>,        // object | array | null
  "message": "Tạo booking thành công"   // tùy chọn, dùng cho toast UI
}
```

### 15.2 Error Response

```typescript
// HTTP 4xx / 5xx
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",          // machine-readable, FE switch case theo đây
    "message": "Khung giờ không khả dụng" // human-readable, hiển thị trực tiếp nếu muốn
  }
}
```

### 15.3 Error Code Registry

Toàn bộ `error.code` được định nghĩa tập trung tại `src/common/errors/error-codes.ts`.

| HTTP | Code | Ý nghĩa |
| :--- | :--- | :--- |
| 400 | `VALIDATION_ERROR` | Input không hợp lệ (class-validator) |
| 400 | `OTP_INVALID` | OTP sai hoặc hết hạn |
| 400 | `OTP_RATE_LIMIT` | Gửi OTP quá giới hạn |
| 400 | `BOOKING_INVALID_STATE` | Thao tác không hợp lệ với trạng thái booking hiện tại |
| 400 | `SERVICE_NOT_ACTIVE` | Dịch vụ không còn khả dụng |
| 400 | `WALLET_INSUFFICIENT` | Số dư ví không đủ (nếu có logic pre-check) |
| 400 | `KYC_PENDING` | Provider chưa được duyệt KYC |
| 401 | `UNAUTHORIZED` | Không có hoặc token hết hạn |
| 403 | `FORBIDDEN` | Không đủ quyền (sai role) |
| 403 | `ACCOUNT_LOCKED` | Tài khoản bị khóa tạm thời |
| 403 | `TENANT_VIOLATION` | Cố tình truy cập dữ liệu của người khác |
| 404 | `NOT_FOUND` | Resource không tồn tại |
| 409 | `DUPLICATE_EMAIL` | Email đã được sử dụng |
| 409 | `DUPLICATE_KYC` | Đã có hồ sơ KYC đang chờ duyệt |
| 422 | `PAYMENT_HASH_INVALID` | Chữ ký VNPay không hợp lệ |
| 422 | `PAYMENT_DUPLICATE` | Giao dịch đã được xử lý (idempotency) |
| 500 | `INTERNAL_ERROR` | Lỗi hệ thống chung — không expose stack trace ra ngoài |

### 15.4 Triển khai phía Backend

`AllExceptionsFilter` (`src/common/filters/all-exceptions.filter.ts`) bắt toàn bộ exception và transform về format trên. Không để NestJS trả raw error mặc định.

```typescript
// Ném lỗi trong service layer — ĐÚNG
throw new BadRequestException({ code: 'OTP_INVALID', message: 'Mã OTP không đúng hoặc đã hết hạn' });

// Không được throw như thế này — SAI (FE không parse được)
throw new BadRequestException('OTP sai');
```

### 15.5 Triển khai phía Frontend

Axios response interceptor đọc `error.response.data.error.code` để phân loại:

```typescript
// src/lib/axios.ts — thêm vào response interceptor
const apiError = error.response?.data?.error;
switch (apiError?.code) {
  case 'ACCOUNT_LOCKED':
    toast.error('Tài khoản bị khóa tạm thời. Thử lại sau 15 phút.');
    break;
  case 'TENANT_VIOLATION':
    router.push('/403');
    break;
  case 'INTERNAL_ERROR':
    toast.error('Lỗi hệ thống. Vui lòng thử lại sau.');
    break;
  default:
    // Hiển thị message từ server nếu có, fallback về generic
    toast.error(apiError?.message ?? 'Có lỗi xảy ra');
}
```

---

## 16. Transaction Boundary

> **Quy tắc:** Dùng `prisma.$transaction()` khi operation chạm ≥ 2 bảng **và** tính nhất quán là bắt buộc (mất một bảng = data corrupt). Không bọc transaction thừa cho read-only query.

### 16.1 Danh sách critical flow phải dùng transaction

| Flow | Các bảng liên quan | Lý do |
| :--- | :--- | :--- |
| Booking DONE → trừ hoa hồng (customer confirm) | `bookings`, `provider_wallets`, `wallet_transactions` | Trừ ví mà không cập nhật booking_status_histories = data corrupt |
| Booking DONE → autoComplete (cronjob) | `bookings` (autoCompletedAt), `provider_wallets`, `wallet_transactions` | Tương tự |
| IPN VNPay cộng tiền | `wallet_transactions` (status→SUCCESS), `provider_wallets` (balance+=) | Idempotency + balance phải đồng bộ |
| Admin duyệt KYC | `kyc_profiles` (status→APPROVED), `notifications` | Duyệt xong mà không notify = bug trải nghiệm |
| Admin phán quyết tranh chấp | `disputes` (status→RESOLVED), `provider_wallets` (nếu COMPLETE), `wallet_transactions` | Ba bảng phải đổi đồng thời |
| Provider gửi báo giá | `quotations` (insert), `bookings` (status→QUOTED), `booking_status_histories` | Quote tồn tại mà booking vẫn PENDING = state lệch |
| Provider báo DONE | `bookings` (completedAt, autoCompletedAt), `booking_attachments` (insert), `booking_status_histories` | Ảnh và trạng thái phải cùng lúc |

### 16.2 Pattern sử dụng Prisma Transaction

```typescript
// Critical flow — deductCommission khi booking được chốt
async deductCommission(bookingId: number) {
  return this.prisma.$transaction(async (tx) => {
    // Đọc snapshot rate — không dùng commission_configs hiện tại
    const quotation = await tx.quotation.findUnique({
      where: { bookingId },
    });
    const fee = quotation.actualPrice.toNumber() * quotation.commissionRateSnapshot.toNumber() / 100;

    // Trừ ví (ghi nợ dù âm)
    const wallet = await tx.providerWallet.update({
      where: { providerId: booking.providerId },
      data: { balance: { decrement: fee } },
    });

    // Ghi lịch sử giao dịch
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'COMMISSION',   // không phải COMMISSION_DEDUCTION
        amount: -fee,
        bookingId,
        status: 'SUCCESS',
      },
    });

    // Nếu ví âm → restrict
    if (wallet.balance.toNumber() < 0) {
      await tx.providerWallet.update({
        where: { id: wallet.id },
        data: { isRestricted: true },
      });
    }

    return wallet;
  });
}
```

### 16.3 Non-critical — Không cần transaction

- Gửi notification (thất bại thì retry, không corrupt data)
- Ghi audit log (side effect, không ảnh hưởng business logic)
- Cập nhật `lastLoginAt`, `updatedAt`

Pattern cho non-critical: chạy sau transaction chính, dùng `try/catch` riêng, không throw lên.

```typescript
// Sau khi transaction chính thành công
try {
  await this.notificationService.push(userId, payload);
} catch (e) {
  this.logger.warn('Push notification failed, non-critical', e);
  // KHÔNG throw — không để lỗi notification làm rollback booking
}
```

---

## 17. Caching Strategy

> Redis (Upstash) được dùng có chọn lọc. **Không cache indiscriminately** — over-cache gây stale data bug khó debug hơn performance gain.

### 17.1 Bảng quy tắc cache

| Data | Cache? | TTL | Invalidate khi nào | Key pattern |
| :--- | :---: | :--- | :--- | :--- |
| Danh sách danh mục (categories) | ✅ | 10 phút | Admin CRUD category | `categories:list` |
| Chi tiết dịch vụ (public) | ✅ | 5 phút | Provider update / Admin ẩn | `service:{id}` |
| Danh sách dịch vụ (search results) | ✅ | 3 phút | Service update/hide | `services:search:{hash_of_params}` |
| Hồ sơ Provider (public profile) | ✅ | 30 phút | Provider update profile | `provider:profile:{id}` |
| Trạng thái Booking | ❌ | — | Luôn query DB trực tiếp | — |
| Số dư Ví | ❌ | — | Luôn query DB trực tiếp | — |
| Lịch sử giao dịch ví | ❌ | — | Luôn query DB trực tiếp | — |
| Thông tin user đang đăng nhập | ❌ | — | Đọc từ JWT + DB khi cần | — |
| OTP | ✅ | 10 phút | Dùng xong xóa ngay | `otp:{email}` |
| Brute-force counter | ✅ | 15 phút (TTL = thời gian lock) | Tự hết hạn | `bf:{email}` |
| Rate-limit OTP | ✅ | 24h | Tự hết hạn | `otp:rl:{email}` |

> **Nguyên tắc cứng:** Booking status và wallet balance **không bao giờ cache**. Đây là dữ liệu tài chính, sai 1 giây là nghiêm trọng.

### 17.2 Pattern invalidate cache

```typescript
// Sau khi update service → xóa cache ngay
async updateService(id: string, dto: UpdateServiceDto) {
  const result = await this.prisma.service.update({ where: { id }, data: dto });
  await this.redis.del(`service:${id}`);
  await this.redis.del(`categories:list`); // nếu đổi category
  return result;
}

// Đọc với cache-aside pattern
async getServiceDetail(id: string) {
  const cached = await this.redis.get(`service:${id}`);
  if (cached) return JSON.parse(cached);

  const service = await this.prisma.service.findUnique({ where: { id } });
  await this.redis.setex(`service:${id}`, 300, JSON.stringify(service)); // TTL 5 phút
  return service;
}
```

---

## 18. Logging & Observability

> Mục tiêu: đủ để debug production issue mà không expose thông tin nhạy cảm ra log.

### 18.1 Request Logging Interceptor

File: `src/common/interceptors/logging.interceptor.ts`

Log mỗi request vào ra với format nhất quán:

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const { method, url, user } = req;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(`${method} ${url} ${ms}ms [user:${user?.id ?? 'anon'}]`);
      }),
      catchError((err) => {
        const ms = Date.now() - start;
        this.logger.error(
          `${method} ${url} ${ms}ms [user:${user?.id ?? 'anon'}] ERROR: ${err.message}`,
        );
        throw err; // re-throw để AllExceptionsFilter xử lý
      }),
    );
  }
}
```

Đăng ký global trong `main.ts`:
```typescript
app.useGlobalInterceptors(new LoggingInterceptor());
```

### 18.2 Error Logging Rules

| Loại lỗi | Log level | Có stack trace? | Ghi chú |
| :--- | :--- | :--- | :--- |
| Business error (400, 409) | `warn` | ❌ | Bình thường, không cần trace |
| Auth error (401, 403) | `warn` | ❌ | Log userId + endpoint là đủ |
| Not found (404) | `log` | ❌ | Có thể do URL sai từ FE |
| System error (500) | `error` | ✅ | Cần trace để debug |
| Payment error (VNPay) | `error` | ✅ | Log đầy đủ request/response |

```typescript
// AllExceptionsFilter — phân loại log theo status
if (status >= 500) {
  this.logger.error(exception.message, exception.stack);
} else if (status >= 400) {
  this.logger.warn(`${status} ${exception.message}`);
}
```

### 18.3 Thông tin KHÔNG được log

- Password, OTP, token, API key (dù đã hash)
- Nội dung tin nhắn chat
- Thông tin CCCD/KYC
- VNPay hash secret

---

## 19. AI Fallback Strategy

### 19.1 Semantic Search (UC15.3)

```
User query
    │
    ▼
[1] Tạo vector embedding từ query (OpenAI text-embedding-ada-002)
    │ timeout: 5s
    ├── Thành công ──► pgvector cosine similarity search
    │                  WHERE similarity >= 0.72        ← threshold
    │                  ORDER BY similarity DESC
    │                  LIMIT 10
    │
    └── Thất bại / timeout ──► [Fallback 1] Full-text search
                                WHERE to_tsvector(name || description)
                                @@ plainto_tsquery(query)
                                    │
                                    └── 0 kết quả ──► [Fallback 2] Popular services
                                                       ORDER BY bookingCount DESC
                                                       LIMIT 10
```

**Giải thích threshold 0.72:** Cosine similarity từ 0–1. Dưới 0.72 = không đủ liên quan, trả về sẽ làm giảm chất lượng gợi ý. Giá trị này có thể điều chỉnh sau khi có data thực.

### 19.2 Chatbot RAG (UC18.3)

```
Customer gửi tin nhắn
    │
    ▼
Kiểm tra Provider online?
    │
    ├── Online ──► Chuyển tin nhắn trực tiếp, KHÔNG dùng AI
    │
    └── Offline ──► Gọi OpenAI với context:
                    system: mô tả dịch vụ + FAQ từ DB
                    user:   tin nhắn của customer
                        │
                        │ timeout: 5s
                        ├── Thành công ──► Trả về response, đánh nhãn "AI"
                        │
                        └── Thất bại ──► Fallback message cố định:
                                         "Nhà cung cấp hiện vắng mặt,
                                          vui lòng để lại lời nhắn."
```

**AI không được phép:** cam kết giá, chốt lịch hẹn, hứa hẹn thay mặt provider.

### 19.3 Config tập trung

```typescript
// src/config/ai.config.ts
export const AI_CONFIG = {
  TIMEOUT_MS: 5000,
  VECTOR_SIMILARITY_THRESHOLD: 0.72,
  EMBEDDING_MODEL: 'text-embedding-ada-002',
  CHAT_MODEL: 'gpt-4o-mini',
  MAX_CONTEXT_TOKENS: 1000,   // giới hạn context inject vào chatbot
};
```

---

## 20. File & Folder Convention

### 20.1 NestJS — Module Structure

Mỗi module trong `src/modules/` tuân theo cấu trúc chuẩn. Tổ chức theo **feature**, không theo layer global (không có thư mục `controllers/`, `services/` ở cấp project).

```
modules/bookings/
├── bookings.module.ts           # Khai báo imports, providers, exports
├── bookings.controller.ts       # Route handler — THIN, chỉ gọi service
├── bookings.service.ts          # Toàn bộ business logic
├── dto/
│   ├── create-booking.dto.ts    # class-validator decorators
│   ├── update-booking.dto.ts
│   └── booking-response.dto.ts  # Shape trả về (không return Prisma entity thô)
├── types/
│   └── booking.types.ts         # Internal TypeScript types của module
└── __tests__/
    └── bookings.service.spec.ts
```

> **Vì sao không có `repository.ts`:** Prisma Client đã là repository layer. Chỉ tạo thêm file repository khi có ≥ 3 raw query phức tạp cần tái dụng ở nhiều service.

**Quy tắc phân tầng — không được vi phạm:**

| Lớp | Được làm | Không được làm |
| :--- | :--- | :--- |
| `Controller` | Nhận request, gọi service, trả response | Chứa business logic, query DB, gọi HTTP ngoài |
| `Service` | Business logic, gọi Prisma, throw lỗi | Access `req`/`res`, gọi HTTP trực tiếp |
| `Module` | Import dependencies | Chứa logic |

**Ví dụ Controller đúng:**
```typescript
// ✅ ĐÚNG — controller chỉ điều phối
@Post()
@UseGuards(JwtAuthGuard)
create(@Body() dto: CreateBookingDto, @CurrentUser() user: User) {
  return this.bookingService.create(user.id, dto);
}

// ❌ SAI — logic nằm trong controller
@Post()
async create(@Body() dto: CreateBookingDto) {
  const service = await this.prisma.service.findUnique(...); // SAI
  if (!service) throw new Error('not found');                // SAI
  return this.prisma.booking.create(...);                    // SAI
}
```

### 20.2 NestJS — DTO & Validation

**Bắt buộc** dùng class-validator cho mọi input. Global pipe cấu hình trong `main.ts`:

```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,              // tự động strip field không khai báo trong DTO
  forbidNonWhitelisted: true,   // throw lỗi nếu client gửi field lạ
  transform: true,              // auto-transform string → number, string → Date
}));
```

**Mẫu DTO chuẩn:**
```typescript
export class CreateBookingDto {
  @IsUUID()
  serviceId: string;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @IsDateString()
  @IsAfterNow()   // custom decorator
  desiredTime: string;

  @IsNumber()
  @Min(-90) @Max(90)
  lat: number;
}
```

**Không return Prisma entity thô** — map sang response DTO:
```typescript
// ✅ ĐÚNG
return {
  id: booking.id,
  status: booking.status,
  service: { id: booking.service.id, name: booking.service.name },
};

// ❌ SAI — lộ toàn bộ internal fields, kể cả deletedAt, password hash...
return booking;
```

### 20.3 Next.js — Folder Boundaries

Cấu trúc **feature-based**: mỗi domain có thư mục riêng trong `features/`, chứa components + hooks + API calls của domain đó.

```
src/
├── app/                    # CHỈ chứa page.tsx, layout.tsx, loading.tsx, error.tsx
│   ├── (main)/bookings/
│   │   └── page.tsx        # Import từ features/booking, không viết logic ở đây
│   └── (provider)/bookings/
│       └── page.tsx
│
├── features/               # Logic + UI theo domain — đây là nơi code chính
│   ├── booking/
│   │   ├── components/     # BookingCard, BookingTimeline, QuoteForm...
│   │   ├── hooks/          # use-booking-list.ts, use-booking-detail.ts
│   │   ├── services/       # booking.api.ts — wrapper axios cho booking endpoints
│   │   └── types.ts        # BookingFilters, BookingCardProps...
│   ├── service/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   ├── wallet/
│   ├── chat/
│   └── auth/
│
├── components/
│   ├── ui/                 # Shadcn primitives — stateless, không gọi API
│   └── shared/             # Dùng ≥ 2 feature (Navbar, NotificationBell, Avatar)
│
├── lib/
│   ├── axios.ts            # Axios instance + interceptors (singleton)
│   ├── socket.ts           # Socket.io client (singleton)
│   └── utils.ts            # cn(), formatCurrency(), formatDate()
│
├── store/                  # Zustand — CHỈ cho: auth, notifications, booking cache
├── hooks/                  # Global hooks dùng ≥ 2 feature (use-socket, use-auth)
└── types/                  # Global enums: BookingStatus, Role, ServiceStatus...
```

**Luồng gọi API bắt buộc — 3 tầng:**
```
app/page.tsx
    └── features/booking/hooks/use-booking-list.ts   (quản lý state + loading)
            └── features/booking/services/booking.api.ts  (gọi axios)
                    └── lib/axios.ts                       (instance + interceptors)
```

> **Không được** gọi axios trực tiếp trong `page.tsx`, `layout.tsx`, hay bất kỳ component nào.

**Ví dụ API service đúng:**
```typescript
// features/booking/services/booking.api.ts
import api from '@/lib/axios';
import { CreateBookingDto, BookingResponse } from '../types';

export const bookingApi = {
  create: (dto: CreateBookingDto) =>
    api.post<BookingResponse>('/bookings', dto),

  getById: (id: string) =>
    api.get<BookingResponse>(`/bookings/${id}`),

  cancel: (id: string, reason: string) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),
};
```

```typescript
// features/booking/hooks/use-booking-detail.ts
export function useBookingDetail(id: string) {
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookingApi.getById(id)
      .then(res => setBooking(res.data.data))
      .finally(() => setLoading(false));
  }, [id]);

  return { booking, loading };
}
```

### 20.4 Next.js — Server vs Client Component

| Loại | Dùng khi | Không dùng khi |
| :--- | :--- | :--- |
| **Server Component** (default) | Fetch data cho SEO, render static content, layout | Cần state, event handler, browser API |
| **Client Component** (`'use client'`) | Form, interaction, socket, hooks, Zustand | Không cần interactivity |

```typescript
// ✅ Server Component — fetch data, không cần 'use client'
// app/(main)/services/[id]/page.tsx
async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const service = await fetch(`${API_URL}/services/${params.id}`).then(r => r.json());
  return <ServiceDetail service={service.data} />;
}

// ✅ Client Component — chỉ khi cần interactivity
// features/booking/components/BookingForm.tsx
'use client';
export function BookingForm({ serviceId }: { serviceId: string }) {
  const form = useForm({ resolver: zodResolver(schema) });
  // ...
}
```

> **Nguyên tắc:** Đặt `'use client'` càng thấp trong component tree càng tốt. Page mặc định là Server Component — chỉ chuyển sang Client khi thực sự cần.

### 20.5 Next.js — State Management Rules

**Zustand chỉ dùng cho 3 loại state:**

| Được dùng Zustand | Không dùng Zustand |
| :--- | :--- |
| Auth state (user, tokens) | Form state → dùng `react-hook-form` |
| Notifications array | Server data / API response → dùng local state trong hook |
| Booking cache hiện tại | UI state (modal open/close) → dùng `useState` |

```typescript
// ✅ ĐÚNG — Zustand cho auth global
const { user, setTokens } = useAuthStore();

// ❌ SAI — Zustand cho form data
const { bookingForm, setBookingForm } = useBookingStore(); // không cần thiết
```

### 20.6 Naming Convention

| Loại | Convention | Ví dụ |
| :--- | :--- | :--- |
| NestJS file | `kebab-case` | `create-booking.dto.ts` |
| NestJS class | `PascalCase` | `BookingsService`, `CreateBookingDto` |
| NestJS route | `plural, kebab` | `/bookings`, `/wallet-transactions` |
| Next.js component file | `PascalCase` | `BookingCard.tsx`, `QuoteForm.tsx` |
| Next.js hook file | `kebab-case` + prefix `use-` | `use-booking-detail.ts` |
| Feature API service | `kebab-case` + `.api.ts` | `booking.api.ts` |
| Zustand store | `kebab-case` + `.store.ts` | `auth.store.ts` |
| Prisma model | `PascalCase` | `Booking`, `WalletTransaction` |
| DB column | `snake_case` | `created_at`, `provider_id` |
| Env variable | `UPPER_SNAKE_CASE` | `VNPAY_HASH_SECRET` |
| TypeScript enum value | `UPPER_SNAKE_CASE` | `BookingStatus.IN_PROGRESS` |

---

## 21. Code Quality Checklist

> Dùng checklist này khi review code của mình hoặc của người khác. **Mỗi mục là một câu hỏi Yes/No.**

### 21.1 Backend (NestJS)

**Structure**
- [ ] Module tổ chức theo feature, không theo layer global?
- [ ] Controller không chứa business logic, không query DB trực tiếp?
- [ ] Service là nơi duy nhất chứa business logic?
- [ ] Không return Prisma entity thô — đã map sang response DTO?

**Validation & Error**
- [ ] Mọi `@Body()` đều có DTO với class-validator?
- [ ] `ValidationPipe` có `whitelist: true` và `forbidNonWhitelisted: true`?
- [ ] Mọi `throw` dùng `HttpException` với `{ code, message }`, không throw string?
- [ ] `AllExceptionsFilter` đã đăng ký global?

**Security**
- [ ] Endpoint cần auth đã có `@UseGuards(JwtAuthGuard)`?
- [ ] Query dữ liệu nhạy cảm đã filter theo `userId`/`providerId`?
- [ ] Không log password, token, OTP, CCCD?

**Database**
- [ ] Chỉ dùng `PrismaService`, không dùng TypeORM?
- [ ] Flow chạm ≥ 2 bảng quan trọng đã bọc trong `prisma.$transaction()`?
- [ ] Soft delete — không có `prisma.*.delete()` cho business data?

**Performance**
- [ ] Query có `include` không cần thiết sẽ bị loại bỏ?
- [ ] Không cache booking status và wallet balance?

---

### 21.2 Frontend (Next.js)

**Structure**
- [ ] `app/page.tsx` chỉ chứa layout + import từ `features/`?
- [ ] Logic và UI component nằm trong `features/{domain}/`?
- [ ] Không gọi axios trực tiếp trong component hay page?
- [ ] Luồng call đúng: `page → hook → api service → axios`?

**Component**
- [ ] Component > 200 dòng đã được tách nhỏ?
- [ ] `'use client'` chỉ dùng khi thực sự cần interactivity?
- [ ] Server Component dùng cho các trang có thể fetch trước?

**State**
- [ ] Form dùng `react-hook-form` + `zod`, không dùng `useState` cho từng field?
- [ ] Zustand chỉ dùng cho auth, notifications, global cache — không dùng cho form hay server data?
- [ ] Không hardcode API URL — dùng `NEXT_PUBLIC_API_URL`?

**Error & UX**
- [ ] Error từ API đọc `error.code`, không parse `message` string?
- [ ] Loading state hiển thị skeleton, không để màn hình trắng?
- [ ] Không có `console.log` trong production code?
