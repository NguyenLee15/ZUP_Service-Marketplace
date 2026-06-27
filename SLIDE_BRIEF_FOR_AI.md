# Brief tạo slide thuyết trình cho dự án Zup / Service Marketplace

Tài liệu này dùng để đưa cho AI khác tạo slide thuyết trình. Mục tiêu là tạo bộ slide khoảng 15 trang, trình bày trong 10-15 phút, bám sát đúng hệ thống đang có trong repo.

## 1. Thông tin tổng quan dự án

- Tên hiển thị trên web: **Zup**
- Tên mô tả đề tài: **Service Marketplace**
- Loại sản phẩm: nền tảng đặt dịch vụ tại nhà, đa vai trò
- Mục tiêu: kết nối khách hàng, nhà cung cấp dịch vụ và quản trị viên trong một hệ thống thống nhất
- Nền tảng: web + 2 app mobile + backend API

### Bài toán dự án giải quyết

Hệ thống giải quyết các vấn đề sau:

- Khách hàng khó tìm, so sánh và đặt dịch vụ tại nhà một cách thuận tiện
- Nhà cung cấp khó quản lý dịch vụ, booking, báo giá, thanh toán và tương tác với khách hàng
- Quản trị viên cần công cụ để kiểm soát người dùng, dịch vụ, tranh chấp, danh mục và vận hành hệ thống
- Cần có trải nghiệm thời gian thực cho chat, thông báo và hỗ trợ AI

### Kết quả cốt lõi của sản phẩm

- Tìm kiếm và lọc dịch vụ
- Đặt lịch dịch vụ
- Báo giá và xác nhận booking
- Theo dõi trạng thái booking bằng timeline
- Chat realtime giữa khách hàng và nhà cung cấp
- Chatbot AI hỗ trợ người dùng
- Ví nhà cung cấp, nạp tiền, rút tiền
- Đánh giá, khiếu nại, xử lý tranh chấp
- Quản trị dịch vụ, KYC, audit log và dashboard admin

## 2. Công nghệ và kiến trúc

### Công nghệ chính

- Frontend web: Next.js, React, TypeScript
- Mobile khách hàng: Expo Router, React Native, TypeScript
- Mobile nhà cung cấp: Expo Router, React Native, TypeScript
- Backend: NestJS, TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Realtime: Socket.IO
- Queue / background jobs: BullMQ
- Storage ảnh: Cloudinary
- Email: Brevo
- AI: Google Gemini
- Thanh toán: PayOS
- Deploy: Render cho backend, Vercel cho frontend

### Vai trò các tầng trong kiến trúc

#### Mô hình tổng quát

- Kiến trúc client-server, triển khai theo 3 tầng
- Client gồm web và 2 app mobile
- Server là backend API
- Database là tầng lưu trữ dữ liệu

#### Tầng giao diện

- Hiển thị dữ liệu cho khách hàng, nhà cung cấp và admin
- Thu thập input người dùng
- Tối ưu trải nghiệm và điều hướng

#### Tầng API / nghiệp vụ

- Xử lý xác thực và phân quyền
- Validation dữ liệu
- Điều phối các luồng nghiệp vụ như auth, service, booking, chat, wallet, dispute, review
- Tích hợp dịch vụ bên ngoài

#### Tầng dữ liệu

- Lưu người dùng, dịch vụ, booking, báo giá, tin nhắn, ví, giao dịch, khiếu nại, thông báo, audit log
- Quản lý quan hệ giữa các thực thể

#### Tích hợp ngoài / hỗ trợ

- Thanh toán qua PayOS
- Ảnh qua Cloudinary
- Email qua Brevo
- AI qua Gemini
- Realtime qua Socket.IO
- Queue, worker, cron và Redis dùng để xử lý tác vụ nền và đồng bộ trạng thái

## 3. Các điểm nổi bật để nhấn trong slide

### Cái đã kế thừa / tham khảo

- Mô hình marketplace nhiều vai trò
- Các luồng cơ bản như đăng ký, đăng nhập, tìm dịch vụ, đặt lịch, đánh giá
- Cách tổ chức dịch vụ theo danh mục, booking, review và admin panel

### Cái mới trong sản phẩm

- Chat realtime giữa khách hàng và nhà cung cấp
- Chatbot AI
- Báo giá dịch vụ và cập nhật trạng thái booking theo tiến trình
- Ví nhà cung cấp và nghiệp vụ nạp / rút / ghi nhận giao dịch
- Tranh chấp booking và xử lý bằng admin
- Featured listing
- Audit log và dashboard quản trị
- KYC nhà cung cấp bằng CCCD + ảnh chân dung, có xét duyệt bởi admin
- Thông báo đẩy và đồng bộ trạng thái qua socket

### Ưu điểm của hệ thống

- Phân tách rõ tầng frontend, backend và database
- Kiến trúc client-server, 3 tầng, dễ giải thích khi bảo vệ
- Có kiến trúc đa vai trò
- Có real-time và AI
- Có kiểm thử cho các luồng quan trọng
- Có triển khai thực tế với Render và Vercel

## 4. Dữ liệu từ repo để dùng khi thuyết trình

### Các bảng dữ liệu quan trọng trong Prisma

- `User`
- `LoginAttempt`
- `OtpAttempt`
- `RefreshToken`
- `PasswordReset`
- `KycProfile`
- `UserAddress`
- `ServiceCategory`
- `Service`
- `ServiceImage`
- `ServiceItem`
- `Booking`
- `BookingItem`
- `Quotation`
- `QuotationItem`
- `BookingAttachment`
- `BookingStatusHistory`
- `ProviderWallet`
- `WalletTransaction`
- `WithdrawalRequest`
- `ManualDepositRequest`
- `CommissionConfig`
- `Review`
- `Conversation`
- `Message`
- `ChatbotSession`
- `ChatbotSessionMessage`
- `Notification`
- `AuditLog`
- `Dispute`
- `DisputeEvidence`
- `SystemSetting`
- `FeaturedListing`

### Các module backend nổi bật

- `auth`
- `users`
- `categories`
- `services`
- `bookings`
- `provider-wallets`
- `chats`
- `notifications`
- `reviews`
- `admin`
- `chatbot`
- `storage`
- `settings`
- `health`
- `storage`
- `shared`

### Dấu hiệu hệ thống đã có kiểm thử

- Có unit test / spec cho một số service và policy
- Có e2e test
- Có integration test
- Có smoke test staging

### Dấu hiệu triển khai

- Backend có health check path `/health`
- Deploy backend trên Render
- Deploy frontend trên Vercel
- Có build command và migrate deploy cho production
- Hệ thống có `queue`, `worker`, `cron` và `Redis` cấu hình theo môi trường để hỗ trợ xử lý nền

## 5. Yêu cầu bắt buộc khi làm slide

- Tổng số: 15 slide
- Thời lượng trình bày: 10-15 phút
- Ngôn ngữ: tiếng Việt
- Phong cách: rõ ràng, học thuật, gọn, có tính trình bày đồ án
- Không dùng nội dung chung chung
- Mỗi slide chỉ nên có ý chính, không nhồi quá nhiều chữ

## 6. Phân bổ 15 slide

### Slide 1 - Bìa

- Tên đề tài
- Tên hiển thị sản phẩm: Zup
- Họ tên sinh viên
- Lớp
- GVHD
- Logo / ảnh minh họa

### Slide 2 - Chương 1

- Giới thiệu đề tài
- Lý do chọn đề tài
- Bối cảnh thực tế

### Slide 3 - Chương 2

- Bài toán cần giải quyết
- Người dùng mục tiêu
- Nhu cầu thực tế

### Slide 4 - Chương 2

- Phạm vi hệ thống
- Những phần kế thừa / tham khảo
- Những phần tự phát triển thêm

### Slide 5 - Chương 3

- Kiến trúc tổng thể
- Các tầng của hệ thống
- Vai trò của từng tầng

### Slide 6 - Chương 3

- Công nghệ sử dụng
- Lý do chọn công nghệ

### Slide 7 - Chương 3

- Mô hình dữ liệu chính
- Các thực thể trung tâm

### Slide 8 - Chương 3

- Chức năng khách hàng
- Luồng sử dụng chính

### Slide 9 - Chương 3

- Chức năng nhà cung cấp
- Chức năng admin

### Slide 10 - Chương 3

- Tính năng nổi bật
- Điểm mới của sản phẩm

### Slide 11 - Chương 4

- Kiểm thử hệ thống
- Loại test đã thực hiện

### Slide 12 - Chương 4

- Hiệu năng hệ thống
- Cần nêu số đo cụ thể nếu có

### Slide 13 - Chương 4

- Kiến trúc triển khai
- Hệ thống đang chạy ở đâu
- Vai trò các dịch vụ triển khai

### Slide 14 - Kết quả và hướng phát triển

- Kết quả đạt được
- Ưu điểm
- Hướng phát triển

### Slide 15 - Cảm ơn

- Lời cảm ơn
- Q&A

## 7. Gợi ý nội dung nói khi trình bày

### 7.1. Bài toán mình giải quyết cái gì

- Giải thích ngắn gọn vấn đề thực tế
- Nêu rõ ai là người dùng
- Nêu rõ hệ thống giải quyết pain point nào

### 7.2. Dùng công cụ, giải pháp công nghệ nào

- Nêu web khách hàng/admin, app khách hàng, app nhà cung cấp, backend, database, realtime, AI, thanh toán, storage
- Nêu lý do chọn stack
- Nêu vai trò từng lớp trong kiến trúc

### 7.3. Kết quả đạt được

- Phần nào kế thừa / tham khảo
- Phần nào là đóng góp mới
- Ưu điểm của hệ thống
- Hướng phát triển tiếp theo

### 7.4. Câu hỏi về hiệu năng

- Không trả lời cảm tính kiểu “em nghĩ là”
- Phải chuẩn bị số liệu rõ ràng
- Nên có:
  - thời gian phản hồi trung bình
  - thời gian phản hồi p95 nếu có
  - số request đã test
  - môi trường test

### 7.5. Câu hỏi về kiến trúc triển khai

- Phải nói rõ kiến trúc client-server
- Phải nêu đúng 3 tầng: giao diện, nghiệp vụ, dữ liệu
- Phải nói frontend ở đâu, backend ở đâu, database ở đâu
- Ảnh, mail, AI, thanh toán, realtime là dịch vụ hỗ trợ bên ngoài
- Nêu rõ luồng request đi qua các tầng như thế nào

## 8. Prompt ngắn gọn để đưa cho AI tạo slide

Hãy tạo bộ slide thuyết trình tiếng Việt cho đồ án tốt nghiệp dự án Zup / Service Marketplace. Slide cần khoảng 15 trang, đủ cho bài thuyết trình 10-15 phút. Nội dung phải bám sát dự án thực tế: hệ thống đặt dịch vụ tại nhà đa vai trò, có web Next.js cho khách hàng và admin, app mobile cho khách hàng, app mobile cho nhà cung cấp, backend NestJS, PostgreSQL, Prisma, Socket.IO, BullMQ, Cloudinary, Brevo, Gemini AI, PayOS. Slide phải làm rõ 3 ý: bài toán giải quyết, công nghệ và giải pháp đã dùng, kết quả đạt được bao gồm phần kế thừa, phần mới, ưu điểm và hướng phát triển. Phải có slide riêng về kiến trúc client-server theo mô hình 3 tầng, nêu rõ vai trò của tầng giao diện, tầng nghiệp vụ và tầng dữ liệu. Các dịch vụ như PayOS, Cloudinary, Brevo, Gemini, Socket.IO chỉ là thành phần hỗ trợ tích hợp ngoài. Phải có slide riêng về kiểm thử và hiệu năng, đồng thời ghi chú rằng hiệu năng cần số liệu thật từ môi trường test, không nói cảm tính. Giữ bố cục rõ ràng, học thuật, dễ trình bày, mỗi slide ngắn gọn, có tiêu đề rõ và ý chính dễ đọc.
