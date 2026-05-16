<!-- FILE: 01_NFR_FAILURE.md | SCOPE: Non-Functional Requirements + Failure Scenarios (FS01–FS08) -->

## YÊU CẦU PHI CHỨC NĂNG (NFR) {#nfr}

### NF01 – Hiệu năng (Performance)

| Chỉ số | Ngưỡng | Điều kiện đo |
|---|---|---|
| API response time (P95) | ≤ 500ms | 100 concurrent users, môi trường staging |
| API response time (P99) | ≤ 2000ms | 100 concurrent users, môi trường staging |
| AI chatbot response | ≤ 5 giây | Điều kiện bình thường; timeout → fallback |
| AI gợi ý dịch vụ (UC15.3) | ≤ 5 giây | Điều kiện bình thường; timeout → full-text search fallback |
| WebSocket message delivery | ≤ 200ms (RTT) | Mạng trong nước, 4G trở lên |
| Tải trang danh sách dịch vụ | ≤ 3 giây | Kết nối 4G, ảnh đã tối ưu |

**Chiến lược tối ưu:**
- Phân trang server-side bắt buộc cho toàn bộ danh sách
- Index DB cho các cột tìm kiếm/lọc thường dùng (status, created_at, provider_id, service_id)
- Nén ảnh phía client trước khi upload
- CDN cho static assets và ảnh dịch vụ

---

### NF02 – Khả năng mở rộng (Scalability)

- **Phạm vi đồ án:** Triển khai monolithic / single server; chưa áp dụng scale-out thực tế
- **Định hướng thiết kế để migrate sau này:**
  - Session stateless (JWT) → không phụ thuộc sticky session
  - Không hard-code business logic trong DB stored procedure
  - Tách biệt Frontend / Backend / AI module ngay từ đầu
  - Sử dụng message queue (BullMQ/Redis) cho tác vụ nặng (gửi email, AI inference)
- **Mục tiêu scale tương lai:** Hệ thống có thể horizontal scale Backend lên 2–3 node khi lượng booking vượt 1.000/ngày mà không cần refactor lớn

---

### NF03 – Tính sẵn sàng (Availability)

- **Môi trường đồ án:** Không cam kết uptime production
- **Cơ chế đảm bảo ổn định:**
  - Health check endpoint `GET /health` trả về trạng thái DB, Redis, AI service
  - Auto-restart dịch vụ khi crash (PM2 hoặc Docker restart policy)
  - Cronjob phải có cơ chế idempotent (xem NF05)
- **RTO (Recovery Time Objective):** ≤ 30 phút trong môi trường đồ án
- **RPO (Recovery Point Objective):** ≤ 24 giờ (backup hàng ngày)

---

### NF04 – Bảo mật (Security)

- **Xác thực & Phân quyền:**
  - Mật khẩu hash bằng bcrypt (cost factor ≥ 12)
  - RBAC: Customer / Provider / Staff / Admin
  - Access token (JWT, TTL 15–30 phút) + Refresh token (HTTP-only cookie, TTL 7–30 ngày)
  - Token bị vô hiệu hóa ngay khi đăng xuất, đổi mật khẩu, hoặc tài khoản bị khóa
  - WebSocket phải xác thực JWT tại thời điểm handshake; kết nối không có token hợp lệ bị đóng ngay

- **Bảo vệ API:**
  - Chống SQL Injection: ORM parameterized query bắt buộc
  - Chống XSS: Escape output, Content Security Policy header
  - Chống CSRF: SameSite=Strict cookie hoặc CSRF token
  - Rate limiting API toàn cục: mặc định 100 req/phút/IP; endpoint nhạy cảm (login, OTP) rate limit riêng
  - Kiểm soát truy cập: mỗi API endpoint gắn middleware xác thực role

- **Bảo mật dữ liệu KYC:**
  - File CCCD, ảnh chân dung lưu trên cloud storage với access control private (không public URL)
  - URL truy cập file KYC phải là pre-signed URL có TTL ≤ 1 giờ, chỉ cấp cho Admin/Staff đang đăng nhập
  - File KYC được scan malware tự động sau khi upload (nếu có dịch vụ scan)
  - Sau khi KYC được duyệt, file vẫn giữ nguyên để đối chiếu pháp lý; không xóa tự động

- **Tuân thủ:**
  - Dữ liệu cá nhân (CCCD, SĐT, địa chỉ) tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân
  - **Mã hóa trường nhạy cảm:** Trong phạm vi đồ án, `phone` và `address_detail` lưu plaintext nhưng được bảo vệ ở tầng transport (HTTPS) và tầng truy cập (RBAC). Nếu nâng cấp lên production cần bảo mật cao hơn, áp dụng AES-256 mã hóa ứng dụng (application-level encryption) trước khi ghi vào DB — Service layer mã hóa trước khi gọi Prisma, giải mã sau khi đọc ra. Lưu ý: mã hóa các trường này làm mất khả năng query `WHERE phone = ?` thông thường; giải pháp là dùng HMAC của giá trị để tạo cột index phụ phục vụ tìm kiếm, còn cột gốc chứa bản mã.

---

### NF05 – Tính toàn vẹn và độ tin cậy dữ liệu (Data Integrity & Reliability)

- **Database Transaction:**
  - Áp dụng ACID transaction cho: booking state change, trừ hoa hồng, nạp tiền ví, phán quyết tranh chấp
  - Rollback tự động khi bất kỳ bước nào trong transaction thất bại
  - Transaction bao gồm cả bước ghi audit log — nếu ghi log thất bại, toàn bộ transaction rollback

- **Idempotency (quan trọng):**
  - Tất cả API callback từ cổng thanh toán (VNPay/MoMo) phải sử dụng **Idempotency Key** (mã giao dịch duy nhất từ cổng)
  - Trước khi xử lý callback, hệ thống kiểm tra trong DB xem giao dịch này đã xử lý chưa; nếu rồi → trả về 200 OK mà không xử lý lại
  - Cronjob (auto-acceptance 24h, SLA cảnh báo tranh chấp) phải idempotent: chạy nhiều lần trên cùng một booking chỉ được tạo ra một kết quả

- **Concurrency Control:**
  - Khi hai actor cùng thay đổi trạng thái booking: dùng **Optimistic Locking** (version field) hoặc **Pessimistic Locking** (SELECT FOR UPDATE)
  - Khi hai nhân viên cùng nhấn "Nhận phân xử" cùng lúc (UC09.1): sử dụng `UPDATE ... WHERE assigned_to IS NULL` + kiểm tra row affected = 1
  - Khi NCC nạp tiền và hệ thống đồng thời trừ hoa hồng: sử dụng row-level lock trên bảng wallet

- **Cơ chế Retry:**
  - Gửi email/notification: retry tối đa 3 lần với exponential backoff (1s, 3s, 9s)
  - Gọi AI API: retry 1 lần sau 2 giây; nếu vẫn lỗi → fallback ngay

---

### NF06 – Khả năng sử dụng (Usability)

- **Tiêu chí có thể đo được:**
  - Luồng tạo booking từ trang chi tiết dịch vụ hoàn thành trong ≤ 5 bước
  - Form có real-time validation; không để người dùng biết lỗi sau khi submit
  - Tất cả hành động không đồng bộ hiển thị loading indicator
- Giao diện responsive trên màn hình ≥ 360px (mobile) đến ≥ 1280px (desktop)
- Hỗ trợ thiết bị iOS Safari và Android Chrome phiên bản 2 năm gần nhất

---

### NF07 – Khả năng bảo trì (Maintainability)

- **Kiến trúc phân lớp:** Controller → Service → Repository; không viết business logic trong Controller
- **Cấu hình tập trung:** Các thông số thay đổi thường xuyên (tỉ lệ hoa hồng, SLA timeout, rate limit) phải đọc từ bảng cấu hình DB hoặc biến môi trường — không hard-code trong source
- **Xử lý lỗi thống nhất:** Global error handler trả về chuẩn `{ success, errorCode, message, data }` cho mọi API
- Mã nguồn tổ chức theo module chức năng (auth, booking, wallet, chat, admin...)

---

### NF08 – Khả năng tương thích (Compatibility)

- Hoạt động ổn định trên: Chrome ≥ 120, Edge ≥ 120, Firefox ≥ 120, Safari ≥ 17
- Không phụ thuộc hệ điều hành của người dùng
- WebSocket fallback về Long Polling nếu môi trường mạng không hỗ trợ WS (ví dụ: một số proxy doanh nghiệp)

---

### NF09 – Ghi log và giám sát (Logging and Monitoring)

**Phân tách hai loại log:**

| Loại | Nội dung | Nơi lưu | Retention |
|---|---|---|---|
| **Application Log** | Lỗi kỹ thuật, exception, slow query | File / Logging service | 30 ngày |
| **Audit Log** | Hành động Admin/Staff, thay đổi trạng thái booking, phán quyết tranh chấp, thay đổi hoa hồng | Bảng DB riêng (audit_logs) | Vĩnh viễn |

**Nội dung bắt buộc trong Audit Log:**
- `actor_id`, `actor_role`, `action_type`, `target_entity`, `target_id`, `old_value`, `new_value`, `timestamp`, `ip_address`

**Lưu ý đặc biệt:** Lịch sử chat (UC18) là bằng chứng pháp lý trong tranh chấp → lưu vĩnh viễn, không bao giờ xóa.

---

### NF10 – Sao lưu và phục hồi (Backup and Recovery)

- **RPO:** ≤ 24 giờ (backup hàng ngày vào 2:00 AM)
- **RTO:** ≤ 30 phút (trong môi trường đồ án)
- **Chiến lược backup:**
  - DB: Full backup hàng ngày; lưu tối thiểu 7 bản gần nhất
  - File KYC trên cloud storage: versioning enabled
- **Kiểm thử phục hồi:** Nên thực hiện restore drill ít nhất 1 lần trước khi deploy production

---

### NF11 – AI và cơ chế fallback

- **AI Chatbot (UC18.3):**
  - Context window: Đưa vào prompt tối đa 20 tin nhắn gần nhất + mô tả dịch vụ; tin nhắn cũ hơn bị truncate
  - Guardrail: Prompt system instruction cấm AI cam kết giảm giá, chốt lịch hẹn, hoặc thông tin ngoài phạm vi dịch vụ
  - Fallback khi AI timeout (> 5 giây): Gửi tin nhắn tự động "Nhà cung cấp vắng mặt, vui lòng để lại lời nhắn"

- **AI Gợi ý dịch vụ (UC15.3):**
  - Fallback khi AI timeout (> 5 giây): Chuyển sang Full-text search + toast message thông báo người dùng
  - Cold start cho NCC mới (chưa có đánh giá): Xếp hạng dựa trên ngày tham gia + độ đầy đủ hồ sơ, không bỏ trống kết quả
  - AI không làm gián đoạn trải nghiệm người dùng khi gặp sự cố

---

### NF12 – Kiểm soát đồng thời (Concurrency Control) *(bổ sung)*

Mô tả tập trung các pattern xử lý race condition trong hệ thống:

- **Booking double-claim:** Hai KH cùng tạo booking với cùng NCC vào cùng khung giờ → hệ thống không chặn ở tầng này (NCC tự quản lý lịch); tuy nhiên nếu triển khai slot-based scheduling sau này, cần dùng `SELECT FOR UPDATE`
- **Dispute double-assign:** Hai nhân viên cùng nhấn "Nhận phân xử" → `UPDATE disputes SET assigned_to = ? WHERE id = ? AND assigned_to IS NULL` + kiểm tra `rowsAffected = 1`; người thua nhận thông báo "Tranh chấp đã được nhân viên khác nhận"
- **Wallet concurrent debit:** Trừ hoa hồng từ ví NCC phải dùng `SELECT balance FOR UPDATE` + kiểm tra balance trước khi commit; kết quả âm vẫn cho phép (ghi nợ) nhưng phải ghi cờ `is_restricted = true`
- **Payment callback race:** Idempotency key bắt buộc (xem NF05)

---

## KỊCH BẢN LỖI & FAILURE SCENARIOS {#failure-scenarios}

> Phần này mô tả các kịch bản lỗi hệ thống cụ thể và cách xử lý. Đây là điểm phân biệt thiết kế mid-level vs senior.

### FS01 – Server crash khi đang đếm ngược phán quyết tranh chấp (UC09.2)

**Kịch bản:** Admin ra phán quyết → hệ thống bắt đầu đếm ngược 5 phút server-side → server crash lúc còn 2 phút.

**Xử lý:**
- Thời gian phán quyết được persist vào DB ngay khi Admin xác nhận (không chỉ lưu trong memory)
- Khi server khởi động lại, cronjob recovery kiểm tra các phán quyết có `status = pending_execution` và `execute_at < NOW()` → thực thi ngay
- Nếu `execute_at` chưa đến → schedule lại job cho đúng thời điểm

---

### FS02 – Payment callback bị gọi 2 lần (UC14.2)

**Kịch bản:** VNPay/MoMo gọi callback thành công lần 1, nhưng do timeout phía họ, họ retry và gọi lại lần 2.

**Xử lý:**
1. Khi nhận callback, trích xuất `vnp_TxnRef` từ payload VNPay
2. `SELECT * FROM wallet_transactions WHERE vnpay_txn_ref = ? AND status = 'SUCCESS'`
3. Nếu tìm thấy → trả về HTTP 200 OK ngay (không xử lý lại)
4. Nếu không → bắt đầu xử lý trong `prisma.$transaction()` + lock `wallet_transactions` row
5. Sau khi xử lý xong → update `status = 'SUCCESS'`

---

### FS03 – WebSocket disconnect giữa chừng (UC18.1)

**Kịch bản:** Client mất kết nối trong khi đang nhắn tin.

**Xử lý:**
- Client: Tự động reconnect với exponential backoff (1s, 2s, 4s, 8s, tối đa 30s)
- Khi reconnect: Client gửi `last_message_id` → Server đẩy lại các tin nhắn bị miss
- Message được lưu DB song song ngay khi gửi → đảm bảo không mất tin dù client offline
- Server ping/pong heartbeat mỗi 30 giây để phát hiện kết nối zombie

---

### FS04 – Upload file thất bại giữa chừng (UC01.2, UC11.2, UC17.2)

**Kịch bản:** File đã lên cloud thành công, nhưng bước ghi DB thất bại (hoặc ngược lại).

**Xử lý:**
- Upload cloud và ghi DB phải nằm trong cùng một flow với compensation:
  1. Upload cloud → lưu cloud URL tạm thời
  2. Ghi DB trong transaction
  3. Nếu DB thất bại → gọi cloud storage API xóa file vừa upload (compensation)
- File chưa được confirm trong DB sau 24 giờ → scheduled cleanup job xóa trên cloud

---

### FS05 – Cronjob auto-acceptance chạy 2 lần (UC17.2)

**Kịch bản:** Cronjob kiểm tra booking hết hạn 24h nghiệm thu chạy duplicate (restart server, hoặc distributed cron).

**Xử lý:**
- Dùng idempotency check trước khi trừ hoa hồng: `SELECT id FROM wallet_transactions WHERE booking_id = ? AND type = 'COMMISSION' AND status = 'SUCCESS'` — nếu tìm thấy → đã xử lý → bỏ qua
- Nếu chưa có record → tiến hành trừ hoa hồng và ghi `auto_completed_at` trong `prisma.$transaction()`
- Booking không đổi status (vẫn giữ `DONE`) — chỉ ghi thêm `auto_completed_at` timestamp

---

### FS06 – Trừ hoa hồng không nguyên tử (UC17.2)

**Kịch bản:** Bước ghi `auto_completed_at` vào booking thành công nhưng bước trừ hoa hồng từ ví NCC thất bại (hoặc ngược lại).

**Xử lý:**
- Toàn bộ luồng `[ghi auto_completed_at] + [tạo wallet_transaction COMMISSION] + [trừ balance ví NCC] + [ghi audit log]` phải nằm trong một `prisma.$transaction()` duy nhất
- Nếu bất kỳ bước nào thất bại → toàn bộ rollback → booking giữ nguyên `DONE` nhưng `auto_completed_at` chưa được ghi → cronjob retry sau 5 phút
- Retry sau 5 phút; nếu vẫn lỗi sau 3 lần → alert Admin qua notification

---

### FS07 – AI Service không phản hồi (UC15.3, UC18.3)

**Kịch bản:** AI API timeout hoặc trả về lỗi 5xx.

**Xử lý:**
- Circuit breaker: Nếu AI lỗi 3 lần liên tiếp trong 1 phút → tắt AI tạm thời 5 phút, dùng fallback 100%
- UC15.3 fallback: Full-text search SQL + toast message thông báo người dùng
- UC18.3 fallback: Gửi tin nhắn "Nhà cung cấp vắng mặt, vui lòng để lại lời nhắn"
- Ghi log lỗi AI để giám sát tỉ lệ lỗi

---

### FS08 – KYC upload: cloud thành công, DB thất bại (UC01.2)

**Xem FS04 — áp dụng cơ chế compensation tương tự.**

Thêm đặc thù KYC:
- Trạng thái `kyc_status = pending_upload` trong DB trước khi upload → nếu DB crash giữa chừng, NCC reload trang thấy form trống (không bị E4 chặn)
- Chỉ set `kyc_status = pending_review` sau khi cloud upload + DB ghi thành công đồng thời

---

### FS09 – File mồ côi trên Cloudinary (Orphaned Files)

**Kịch bản:** User upload ảnh KYC, ảnh dịch vụ, hoặc file chat lên Cloudinary thành công. Tuy nhiên user tắt trình duyệt trước khi nhấn Submit, hoặc form validation thất bại phía client sau khi đã upload. File tồn tại trên Cloudinary nhưng không có bản ghi DB tham chiếu → tốn dung lượng vô thời hạn.

**Xử lý:**
1. Khi bắt đầu upload, tạo bản ghi `attachments` với `status = PENDING` và `cloudinary_id` trong DB trước khi gọi Cloudinary. Nếu DB fail → không upload lên Cloudinary.
2. Sau khi upload Cloudinary thành công + user Submit form → update `status = ACTIVE`.
3. Cronjob `cloudinary.cleanup-orphans` chạy 2AM hàng ngày: quét tất cả bản ghi `attachments` có `status = PENDING` và `created_at < NOW() - 24h` → xóa file trên Cloudinary bằng `cloudinary_id` → xóa bản ghi DB.
4. Nếu Cloudinary xóa thất bại (file đã bị xóa thủ công, hoặc network lỗi): log error vào Dead Letter Queue để Admin xem xét, không retry vô hạn, xóa DB record để giải phóng tham chiếu.

**Phạm vi áp dụng:** ảnh dịch vụ (`service_images`), ảnh KYC (`kyc_profiles`), attachment chat và booking (`booking_attachments`, `dispute_evidences`).

---

### FS10 – Deadlock khi Auto-complete nhiều đơn cùng NCC

**Kịch bản:** Cronjob `booking.auto-complete` chạy mỗi giờ. Một NCC có 5 đơn cùng được auto-complete trong cùng một lần chạy. Nếu xử lý song song bằng `Promise.all`, 5 transactions sẽ đồng thời cố gắng lock và UPDATE cùng một row `provider_wallets` → xác suất cao gặp Deadlock tại tầng PostgreSQL.

**Xử lý:**
1. Trong Worker `booking.auto-complete`, trước khi xử lý, nhóm các booking cần auto-complete theo `provider_id`.
2. Với mỗi nhóm `provider_id`, xử lý **tuần tự** (`for...of` loop, không phải `Promise.all`): hoàn thành transaction đơn 1 rồi mới bắt đầu đơn 2.
3. Các nhóm `provider_id` khác nhau có thể chạy song song vì không tranh chấp cùng một row ví.
4. Nếu vẫn gặp Deadlock (do concurrent cronjob hoặc manual trigger trùng): PostgreSQL trả về error code `40P01` → retry tối đa 3 lần với jitter random (50ms–200ms) trước khi đẩy vào Dead Letter Queue.

```typescript
// Worker pattern tránh deadlock
const grouped = _.groupBy(overdueBookings, 'provider_id');
await Promise.all(
  Object.entries(grouped).map(async ([providerId, bookings]) => {
    for (const booking of bookings) {           // ← tuần tự trong cùng NCC
      await processAutoComplete(booking);
    }
  })
);
```

| Actor | Mô tả | Quyền đặc biệt |
|---|---|---|
| **Khách hàng (Customer)** | Người dùng cuối đặt dịch vụ | Tạo booking, đánh giá, khiếu nại |
| **Nhà cung cấp (Provider)** | Cá nhân/tổ chức cung cấp dịch vụ | Cần KYC được duyệt trước khi tạo dịch vụ |
| **Nhân viên (Staff)** | Hỗ trợ điều hành | Duyệt dịch vụ, KYC, xử lý khiếu nại, xem báo cáo |
| **Quản trị viên (Admin)** | Quản trị cao nhất | Toàn quyền + cấu hình hệ thống, xóa tài khoản/dịch vụ |

---

