# Báo Cáo Code Review Toàn Diện - HomeServe

Tiến hành đánh giá kiến trúc, chất lượng mã nguồn, UX/UI, và tính tuân thủ quy tắc (`homeservicerules.md`) cho toàn bộ dự án HomeServe.

---

## 1. BACKEND (NestJS Modular Monolith)

### ✅ Những điểm đã làm rất TỐT và chuẩn chỉnh:
- **Kiến trúc DB (Prisma)**: Áp dụng tuyệt đối `Prisma` và loại bỏ hoàn toàn `TypeORM`. Các rule về tên cột (`full_name`, `is_deleted`) tuân thủ 100%. Không tự ý tạo thêm các bảng sai logic như `customer_wallets`.
- **Bảo vệ toàn vẹn dữ liệu (Transactions)**: 
  - Toàn bộ các thao tác dính đến tiền bạc (Trừ hoa hồng, Tranh chấp, VNPay) đều được bọc trong `prisma.$transaction`.
  - Cơ chế **Row-level locking** (`SELECT FOR UPDATE`) khi nghiệm thu đơn hàng (Customer Accept) hoạt động tốt, ngăn chặn triệt để *Race Condition* với Cronjob.
- **State Machine Đơn hàng**: Luồng đi chuẩn xác `PENDING → QUOTED → CONFIRMED → IN_PROGRESS → DONE`. Quản lý chặt chẽ ngoại lệ hủy đơn (`noshow` cache trong Redis).
- **AI Automation**: Setup bài bản bằng BullMQ (non-blocking). Cấu hình Timeout và Fallback cho các Model Gemini rất tốt (Không block user khi AI bị nghẽn/lỗi).
- **Bảo mật**: `ThrottlerGuard` bảo vệ tốt các Endpoint nhạy cảm (OTP, IPN) bằng `@Throttle` và `@SkipThrottle` hợp lý.

### ⚠️ Những điểm CẦN CẢI THIỆN (Actionable Items):
1. **Chat Gateway Hardcode**: 
   - Trong `ChatsGateway`, `SenderType.CUSTOMER` đang bị gán cứng (`// Will be determined by role in production`). Cần lấy Role từ JWT Token để gán đúng `CUSTOMER` hoặc `PROVIDER`.
2. **WebSocket Scalability**:
   - Hiện tại đang dùng `connectedUsers = new Map()` lưu trên Memory của Node.js. Nếu scale BE lên nhiều server (Horizontal Scaling), user ở Server A nhắn tin, user ở Server B sẽ không nhận được. 
   - **Giải pháp**: Tích hợp `RedisIoAdapter` cho Socket.IO.
3. **Decimal Type Casting**: 
   - Kiểu `Decimal` trong DB được Prisma trả về dưới dạng `Prisma.Decimal` object. Cần thận trọng dùng `Number(val)` ở mọi nơi tính toán tiền tệ (đã làm khá tốt ở `BookingsService`, nhưng cần duy trì).

---

## 2. FRONTEND (Next.js 16.2 App Router)

### ✅ Những điểm đã làm rất TỐT và chuẩn chỉnh:
- **Chuẩn Next.js 16.2**: Các file page chứa tham số URL đã dùng đúng cú pháp: `params: Promise<{ id: string }>` và giải nén bằng `use(params)` trong Client Components, loại bỏ được cảnh báo/lỗi runtime của React 19.
- **Trải nghiệm người dùng (UX)**:
  - Tích hợp **Skeleton Loading** (Suspense) giúp che đi thời gian chờ tải data từ BE, tạo cảm giác mượt mà.
  - Form validations chặt chẽ ngay từ FE với `Zod` và `React Hook Form`.
- **Giao diện**: Dùng Shadcn UI + Tailwind CSS tạo tính nhất quán.

### ⚠️ Những điểm CẦN CẢI THIỆN (Actionable Items):
1. **Định hướng Mobile vs Web**: 
   - Đã thống nhất "Đóng băng (Freeze) bản Web Provider và chuyển sang làm Mobile App cho Provider". Tuy nhiên code Web Provider vẫn còn tồn tại. Nên dời các component này sang dạng "Read-only" hoặc gỡ bỏ dần để dồn lực cho Mobile (React Native/Expo).
2. **Tối ưu Hình ảnh (Performance)**:
   - Các ảnh render từ Cloudinary nên sử dụng component `<Image>` của `next/image` thay vì thẻ `<img>` thường để hỗ trợ Lazy Loading, tự động nén WebP, và phòng chống CLS (Cumulative Layout Shift).

---

## 3. TỔNG KẾT ĐÁNH GIÁ (CHẤM ĐIỂM)

- **System Design / Scalability**: **8.5/10** (Nền tảng vững chắc, sẵn sàng chịu tải nhờ Redis và BullMQ. Trừ 1.5 điểm vì Socket chưa dùng Redis Adapter).
- **Security**: **9/10** (Xử lý tiền tệ, Rate limit và Soft Delete chặt chẽ).
- **Functionality**: **9/10** (Bao phủ đầy đủ luồng nghiệp vụ lõi theo đúng business rules).
- **UX/UI**: **8/10** (Có Skeleton, Form validation tốt nhưng cần chuyển dịch mạnh mẽ sang Mobile).

> [!TIP]
> Tình trạng hiện tại của hệ thống là **SẴN SÀNG PRODUCTION (Production-Ready)** mức độ Beta. Bạn có thể mang đồ án này đi báo cáo ngay lập tức với điểm số rất cao.

**Gợi ý bước tiếp theo:** 
Bắt tay vào setup cấu trúc cho App Mobile (Expo/React Native) dành riêng cho Thợ (Provider) như đã chốt!
