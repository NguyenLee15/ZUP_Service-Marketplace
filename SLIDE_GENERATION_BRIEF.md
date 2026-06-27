# Brief tạo slide thuyết trình cho dự án Zup / Service Marketplace

Tài liệu này dùng để đưa cho AI khác tạo slide thuyết trình.

## Mục tiêu
- Tạo bộ slide khoảng 15 trang
- Trình bày trong 10-15 phút
- Bám sát đúng hệ thống trong repo
- Slide rõ ràng, học thuật, ngắn gọn, dễ trình bày
- Không viết quá nhiều chữ trên một slide
- Không cần bám cứng 100% theo Word; có thể sắp xếp lại cho hợp lý hơn miễn vẫn đúng nội dung chính
- Bắt buộc xuất đúng 15 slide, không hơn không kém
- Không gộp nhiều chương vào 1 slide, không chia nhỏ thêm ngoài 15 slide
- Mỗi slide phải có tiêu đề rõ ràng, ngắn, đúng chủ đề

## Thông tin dự án
- Tên hiển thị: Zup
- Tên đề tài theo báo cáo: Xây dựng hệ thống marketplace dịch vụ tích hợp chatbot, AI gợi ý dịch vụ dựa trên tìm kiếm của khách hàng
- Loại sản phẩm: nền tảng đặt dịch vụ tại nhà, đa vai trò
- Nền tảng: web + 2 app mobile + backend API

## Công nghệ chính
- Web: Next.js, React, TypeScript
- Mobile khách hàng: Expo Router, React Native, TypeScript
- Mobile nhà cung cấp: Expo Router, React Native, TypeScript
- Backend: NestJS, TypeScript
- ORM: Prisma
- Database: PostgreSQL
- Realtime: Socket.IO
- Queue: BullMQ
- Storage ảnh: Cloudinary
- Email: Brevo
- AI: Google Gemini
- Thanh toán: PayOS
- Deploy: Render cho backend, Vercel cho frontend

## Kiến trúc
- Mô hình client-server
- Triển khai theo 3 tầng:
  - tầng giao diện
  - tầng nghiệp vụ
  - tầng dữ liệu
- Dịch vụ hỗ trợ ngoài:
  - PayOS
  - Cloudinary
  - Brevo
  - Gemini
  - Socket.IO
  - Redis, worker, cron, BullMQ

## Điểm nhấn của sản phẩm
- Kế thừa mô hình marketplace nhiều vai trò
- Tự phát triển:
  - chatbot AI
  - AI gợi ý dịch vụ theo tìm kiếm
  - chat realtime
  - booking timeline
  - ví nhà cung cấp
  - khiếu nại và tranh chấp
  - featured listing
  - KYC
  - audit log

## Yêu cầu về ảnh
- Slide bìa nên có ảnh/logo sản phẩm hoặc ảnh nền liên quan dịch vụ tại nhà
- Slide kiến trúc nên có sơ đồ client-server 3 tầng
- Slide phân tích thiết kế nên có use case, activity, sequence, state, class, deployment, ERD
- Slide giao diện nên có screenshot thật từ hệ thống, nhưng chỉ chọn ảnh tiêu biểu
- Slide kiểm thử nên có bảng/biểu đồ số liệu test

## Kịch bản 15 slide

### Slide 1. Bìa
- Nội dung:
  - TÊN ĐỀ TÀI: XÂY DỰNG HỆ THỐNG MARKETPLACE DỊCH VỤ TÍCH HỢP CHATBOT, AI GỢI Ý DỊCH VỤ DỰA TRÊN TÌM KIẾM CỦA KHÁCH HÀNG
  - Giảng viên hướng dẫn: ThS. Đỗ Thị Huyền
  - Sinh viên thực hiện: Lê Văn Nguyên
  - Ngày sinh: 15/08/2004
  - Lớp: DC CNTT13.10.5
  - Ngành: Công nghệ thông tin
  - Khoa: Công nghệ thông tin
  - Khóa: K13
  - Mã sinh viên: 20220785
- Ảnh cần chèn:
  - 1 ảnh nền hoặc logo Zup
- Ghi chú:
  - Thiết kế trang bìa rõ ràng, trang trọng, ít chữ
  - Slide này chỉ hiển thị thông tin bìa, không thêm nội dung khác

### Slide 2. Chương 1 - Tổng quan về đề tài
- Nội dung:
  - Lý do chọn đề tài
  - Mục tiêu tổng quát
  - Mục tiêu cụ thể
  - Nội dung và phạm vi nghiên cứu
  - Đóng góp của đồ án
- Ảnh cần chèn:
  - 1 ảnh minh họa nhu cầu đặt dịch vụ tại nhà
- Ghi chú:
  - Nêu vấn đề thực tế và mục tiêu giải quyết
  - Chỉ trình bày tổng quan, không đi sâu công nghệ

### Slide 3. Chương 2 - Cơ sở lý thuyết
- Nội dung:
  - NestJS
  - Next.js
  - React Native và Expo
  - vai trò của backend, frontend và mobile trong hệ thống
- Ảnh cần chèn:
  - 1 cụm logo công nghệ chính
- Ghi chú:
  - Giải thích ngắn vì sao chọn các công nghệ này
  - Chỉ nói nhóm công nghệ backend, frontend, mobile

### Slide 4. Chương 2 - Cơ sở lý thuyết
- Nội dung:
  - PostgreSQL
  - Prisma
  - Client-server
  - Kiến trúc 3 tầng
  - quan hệ giữa các tầng trong hệ thống
- Ảnh cần chèn:
  - 1 sơ đồ client-server 3 tầng
- Ghi chú:
  - Nhấn rõ 3 tầng: giao diện, nghiệp vụ, dữ liệu
  - Chỉ nói kiến trúc và database, không lặp lại slide 3

### Slide 5. Chương 3 - Phân tích và thiết kế hệ thống
- Nội dung:
  - yêu cầu chức năng
  - yêu cầu phi chức năng
  - tác nhân hệ thống
  - khách hàng, nhà cung cấp, admin
- Ảnh cần chèn:
  - 1 sơ đồ actors hoặc use case tổng quát
- Ghi chú:
  - Nêu rõ hệ thống phục vụ ai và cần gì
  - Chỉ nêu yêu cầu và actors, không đưa sơ đồ quá chi tiết

### Slide 6. Chương 3 - Phân tích và thiết kế hệ thống
- Nội dung:
  - use case
  - activity diagram
  - sequence diagram
  - state diagram
  - tập trung vào các luồng chính: tìm dịch vụ, đặt dịch vụ, báo giá, chat, tranh chấp
- Ảnh cần chèn:
  - 1 sơ đồ nghiệp vụ chính
- Ghi chú:
  - Chỉ chọn các sơ đồ quan trọng, không nhồi quá nhiều
  - Nên chọn 1-2 sơ đồ tiêu biểu, không liệt kê tất cả

### Slide 7. Chương 3 - Phân tích và thiết kế hệ thống
- Nội dung:
  - class diagram
  - component diagram
  - deployment diagram
  - thiết kế CSDL
  - các bảng dữ liệu lõi: user, service, booking, quotation, conversation, wallet, dispute
- Ảnh cần chèn:
  - 1 hình class diagram hoặc ERD
- Ghi chú:
  - Nhấn vào cấu trúc hệ thống và dữ liệu lõi
  - Ưu tiên ERD hoặc deployment/class diagram rõ ràng

### Slide 8. Chương 3 - Phân tích và thiết kế hệ thống
- Nội dung:
  - giao diện khách hàng
  - tìm kiếm dịch vụ
  - chatbot và AI gợi ý dịch vụ
  - quy trình của khách hàng từ tìm kiếm đến đặt dịch vụ
- Ảnh cần chèn:
  - screenshot trang chủ
  - screenshot tìm kiếm hoặc chi tiết dịch vụ
  - screenshot chatbot / AI gợi ý
- Ghi chú:
  - Cho thấy AI hỗ trợ người dùng như thế nào
  - Chỉ tập trung vào luồng khách hàng, không lan sang admin

### Slide 9. Chương 3 - Phân tích và thiết kế hệ thống
- Nội dung:
  - giao diện nhà cung cấp
  - giao diện admin
  - quản lý dịch vụ, booking, ví, KYC
  - quy trình của nhà cung cấp và admin
- Ảnh cần chèn:
  - screenshot dashboard nhà cung cấp
  - screenshot admin dashboard
  - screenshot KYC hoặc dispute
- Ghi chú:
  - Phân biệt rõ chức năng từng vai trò
  - Nhấn trọng tâm vào nhà cung cấp và admin

### Slide 10. Chương 3 - Phân tích và thiết kế hệ thống
- Nội dung:
  - chat realtime
  - chatbot AI
  - booking timeline
  - ví nhà cung cấp
  - featured listing
  - audit log, KYC
  - điểm mới so với marketplace thông thường
- Ảnh cần chèn:
  - screenshot chat realtime
  - screenshot booking timeline hoặc chi tiết booking
  - screenshot ví tiền
- Ghi chú:
  - Đây là slide để nhấn phần nổi bật của sản phẩm
  - Chỉ chọn các tính năng nổi bật nhất, không mô tả lan man

### Slide 11. Chương 4 - Cài đặt và kiểm thử
- Nội dung:
  - cấu trúc mã nguồn backend
  - cấu trúc mã nguồn frontend
  - cấu trúc app mobile
  - cách tổ chức thư mục và module chính
- Ảnh cần chèn:
  - 1 cây thư mục source code đại diện
- Ghi chú:
  - Giới thiệu cách tổ chức code rõ ràng, dễ bảo trì
  - Chỉ nói cấu trúc chính, không liệt kê toàn bộ file

### Slide 12. Chương 4 - Cài đặt và kiểm thử
- Nội dung:
  - giao diện khách hàng
  - giao diện nhà cung cấp
  - giao diện admin
  - các màn hình tiêu biểu đã cài đặt
- Ảnh cần chèn:
  - 1 screenshot màn hình chính khách hàng
  - 1 screenshot màn hình chính nhà cung cấp hoặc admin
- Ghi chú:
  - Chỉ chọn các màn hình quan trọng nhất
  - Mỗi nhóm chức năng chỉ chọn 1 màn hình đại diện

### Slide 13. Chương 4 - Cài đặt và kiểm thử
- Nội dung:
  - kiểm thử chức năng
  - kiểm thử tích hợp
  - kiểm thử e2e
  - kiểm thử bảo mật
  - kiểm thử hiệu năng
  - số liệu test nếu có: thời gian phản hồi, p95, số request
- Ảnh cần chèn:
  - bảng test case ngắn gọn
  - bảng số liệu hiệu năng
  - nếu có thì thêm biểu đồ response time hoặc throughput
- Ghi chú:
  - Hiệu năng phải có số đo thật nếu có
  - Nếu chưa có số liệu, để trống khu vực đo và ghi rõ cần bổ sung

### Slide 14. Chương 5 - Kết luận và hướng phát triển
- Nội dung:
  - kết quả đạt được
  - hạn chế
  - hướng phát triển
  - phần kế thừa, phần mới, ưu điểm của đồ án
- Ảnh cần chèn:
  - bảng tổng kết hoặc sơ đồ kết quả
- Ghi chú:
  - Nêu rõ phần nào kế thừa, phần nào là mới
  - Chỉ chốt kết quả, hạn chế và hướng phát triển

### Slide 15. Cảm ơn
- Nội dung:
  - xin cảm ơn
  - Q&A
- Ảnh cần chèn:
  - logo nhẹ hoặc ảnh nền đơn giản
- Ghi chú:
  - Kết thúc gọn, trang nhã
  - Không thêm nội dung nào khác ngoài cảm ơn và Q&A

## Lưu ý quan trọng
- Slide phải bám đúng cấu trúc 5 chương của báo cáo
- Không đưa PayOS, Cloudinary, Brevo, Gemini, Socket.IO thành tầng riêng
- Phần hiệu năng phải để chỗ cho số liệu thật
- Phần AI phải nhấn đúng chatbot và gợi ý dịch vụ dựa trên tìm kiếm
- Phần giao diện nên ưu tiên screenshot thật từ hệ thống
- Mỗi slide chỉ nên có 1 ảnh chính, tối đa 2 ảnh nhỏ nếu thật cần
- Nếu giao diện có nhiều màn hình, chỉ chọn màn hình đại diện:
  - khách hàng: trang chủ, tìm kiếm, chi tiết dịch vụ, booking, chat
  - nhà cung cấp: dashboard, quản lý dịch vụ, booking, ví
  - admin: dashboard, KYC, dispute, audit log
- Xuất đúng 15 slide, không thêm slide phụ, không tách thành appendix
- Tránh dùng nội dung trùng lặp giữa các slide
- Mỗi slide phải có 1 thông điệp chính duy nhất

## Câu lệnh ngắn cho Gamma
Tạo một deck 15 slide đúng cấu trúc sau: 1 bìa, 1 tổng quan, 2 cơ sở lý thuyết, 5 phân tích thiết kế, 4 cài đặt kiểm thử, 1 kết luận hướng phát triển, 1 cảm ơn. Nội dung bám đề tài marketplace dịch vụ tích hợp chatbot và AI gợi ý dịch vụ. Mỗi slide chỉ 1 thông điệp chính, không thêm slide phụ, không gộp slide, không quá 1 ảnh chính mỗi slide. Ưu tiên screenshot thật của hệ thống và sơ đồ rõ ràng. Slide bìa phải ghi đầy đủ tên đề tài, giảng viên, sinh viên, lớp, ngành, khoa, khóa, MSSV.
