# Script thuyết trình cho dự án Zup / Service Marketplace

## Slide 1. Bìa - 30 giây
Kính thưa thầy cô và các bạn, em xin trình bày đề tài tốt nghiệp của em là **“Xây dựng hệ thống marketplace dịch vụ tích hợp chatbot, AI gợi ý dịch vụ dựa trên tìm kiếm của khách hàng”**.

Hệ thống em xây dựng có tên là **Zup**. Em thực hiện đề tài này dưới sự hướng dẫn của **ThS. Đỗ Thị Huyền**, với mã sinh viên **20220785**, lớp **DC CNTT13.10.5**.

Hôm nay em sẽ trình bày theo đúng bố cục 5 chương của báo cáo, từ tổng quan, cơ sở lý thuyết, phân tích thiết kế, cài đặt kiểm thử cho đến kết luận và hướng phát triển.

## Slide 2. Chương 1 - Tổng quan về đề tài - 50 giây
Ở phần mở đầu, em muốn nói nhanh về lý do chọn đề tài.

Thực tế hiện nay, khi người dùng cần tìm dịch vụ tại nhà, họ thường phải tìm ở nhiều nơi khác nhau, thông tin không đồng nhất và khá khó so sánh. Bên cạnh đó, nhà cung cấp cũng gặp khó khi quản lý booking, báo giá và trao đổi với khách hàng.

Vì vậy, em xây dựng hệ thống này để gom toàn bộ quy trình đó vào một nền tảng thống nhất. Điểm khác của đề tài là ngoài marketplace thông thường, em còn tích hợp chatbot và AI gợi ý dịch vụ dựa trên tìm kiếm của người dùng.

## Slide 3. Chương 2 - Cơ sở lý thuyết - 45 giây
Ở chương 2, em dùng một số công nghệ chính để xây dựng hệ thống.

Backend của em dùng **NestJS** và **TypeScript** vì phù hợp với hệ thống nhiều module và logic nghiệp vụ phức tạp. Frontend web dùng **Next.js** và **React**, còn hai app mobile dùng **Expo Router** và **React Native**.

Phần dữ liệu được lưu trong **PostgreSQL**, và em dùng **Prisma** để map các bảng dữ liệu sang model trong code, giúp làm việc với database thuận tiện hơn.

## Slide 4. Chương 2 - Cơ sở lý thuyết - 50 giây
Về kiến trúc, hệ thống của em đi theo mô hình **client-server** và triển khai theo **3 tầng**.

Tầng giao diện là web và hai app mobile, nơi người dùng tương tác trực tiếp. Tầng nghiệp vụ là backend, nơi xử lý đăng nhập, booking, chat, ví, tranh chấp và các nghiệp vụ chính. Tầng dữ liệu là PostgreSQL, nơi lưu toàn bộ thông tin của hệ thống.

Ngoài ra, em tích hợp thêm một số dịch vụ hỗ trợ như **Socket.IO** cho realtime, **BullMQ** và **Redis** cho tác vụ nền, **Cloudinary** để lưu ảnh, **Brevo** để gửi email, **Gemini** để xử lý AI và **PayOS** cho thanh toán.

## Slide 5. Chương 3 - Phân tích và thiết kế hệ thống - 55 giây
Sang chương 3, em bắt đầu phân tích yêu cầu của hệ thống.

Hệ thống có 3 nhóm người dùng chính: khách hàng, nhà cung cấp và admin. Khách hàng dùng để tìm và đặt dịch vụ. Nhà cung cấp dùng để quản lý dịch vụ, booking và ví. Admin dùng để quản trị hệ thống, xử lý KYC và tranh chấp.

Ngoài ra, hệ thống còn cần các yêu cầu phi chức năng như bảo mật, khả năng mở rộng, tốc độ phản hồi tốt và dễ kiểm soát dữ liệu.

## Slide 6. Chương 3 - Phân tích và thiết kế hệ thống - 55 giây
Ở phần biểu đồ, em dùng use case, hoạt động, trình tự và trạng thái để mô tả luồng nghiệp vụ.

Ví dụ, với khách hàng, luồng chính là tìm dịch vụ, tạo booking, nhận báo giá, xác nhận đơn, theo dõi tiến trình, đánh giá và khiếu nại nếu có vấn đề. Với nhà cung cấp thì sẽ là tạo dịch vụ, nhận booking, gửi báo giá, cập nhật trạng thái và hoàn thành đơn.

Với admin, luồng chủ yếu là duyệt KYC, quản lý user, xử lý tranh chấp và theo dõi hoạt động hệ thống.

## Slide 7. Chương 3 - Phân tích và thiết kế hệ thống - 50 giây
Ở phần thiết kế lớp, thành phần, triển khai và cơ sở dữ liệu, em tập trung vào các thực thể lõi của hệ thống.

Các bảng quan trọng xoay quanh user, service, booking, quotation, conversation, message, wallet, dispute, review và notification. Đây là những bảng tạo nên toàn bộ nghiệp vụ chính của hệ thống.

Thiết kế này giúp em lưu được lịch sử booking, lịch sử chat, lịch sử giao dịch ví và các vấn đề phát sinh trong quá trình vận hành.

## Slide 8. Chương 3 - Phân tích và thiết kế hệ thống - 55 giây
Ở phần giao diện khách hàng, em tập trung vào trải nghiệm tìm kiếm và đặt dịch vụ.

Người dùng có thể tìm dịch vụ theo danh mục, xem chi tiết, đọc đánh giá, tạo booking và theo dõi trạng thái đơn. Ngoài ra hệ thống còn có chatbot và AI gợi ý dịch vụ dựa trên từ khóa tìm kiếm.

Điểm em muốn nhấn mạnh là AI không chỉ để “cho có”, mà được dùng để gợi ý dịch vụ sát hơn với nhu cầu của người dùng, nhất là khi họ chưa biết chọn dịch vụ nào.

## Slide 9. Chương 3 - Phân tích và thiết kế hệ thống - 55 giây
Phần giao diện nhà cung cấp và admin là phần vận hành chính của hệ thống.

Nhà cung cấp có thể quản lý dịch vụ, booking, báo giá, ví và thống kê hiệu suất. Còn admin thì quản lý người dùng, duyệt KYC, xử lý tranh chấp, quản lý danh mục và theo dõi audit log.

Nhờ vậy hệ thống không chỉ phục vụ người đặt dịch vụ mà còn có đủ công cụ cho bên cung cấp và người quản trị.

## Slide 10. Chương 3 - Phân tích và thiết kế hệ thống - 50 giây
Đây là slide em sẽ nhấn mạnh các điểm nổi bật nhất của sản phẩm.

Thứ nhất là chatbot và AI gợi ý dịch vụ. Thứ hai là luồng báo giá và timeline booking giúp người dùng theo dõi rõ đơn hàng. Thứ ba là ví nhà cung cấp, cho phép nạp tiền, rút tiền và ghi nhận giao dịch.

Ngoài ra còn có featured listing, audit log, KYC nhà cung cấp và thông báo đẩy qua socket. Đây là những phần giúp hệ thống sát với một sản phẩm hoàn chỉnh hơn.

## Slide 11. Chương 4 - Cài đặt và kiểm thử - 45 giây
Sang chương 4, em trình bày phần cài đặt và cấu trúc mã nguồn.

Hệ thống được chia khá rõ thành backend, frontend web và hai app mobile. Cách chia này giúp em dễ quản lý mã nguồn, dễ bảo trì và phát triển độc lập từng phần.

Em cũng sẽ nhấn mạnh rằng backend chịu trách nhiệm cho nghiệp vụ lõi, còn các app và web chỉ tập trung vào giao diện và gọi API.

## Slide 12. Chương 4 - Cài đặt và kiểm thử - 50 giây
Ở phần giao diện, em có các màn hình chính cho khách hàng, nhà cung cấp và admin.

Khách hàng thì có màn tìm dịch vụ, đặt lịch, chat, review và theo dõi đơn. Nhà cung cấp thì có màn quản lý dịch vụ, booking và ví. Admin thì có màn quản trị, duyệt KYC, xử lý tranh chấp và xem dashboard.

Phần này chủ yếu để chứng minh hệ thống đã được cài đặt đầy đủ theo đúng vai trò từng nhóm người dùng.

## Slide 13. Chương 4 - Cài đặt và kiểm thử - 55 giây
Ở phần kiểm thử, em đã thực hiện một số mức như unit test, e2e test, integration test và smoke test staging cho các luồng quan trọng.

Phần hiệu năng là phần em phải nói thật rõ bằng số liệu nếu có. Em sẽ nêu thời gian phản hồi trung bình, p95 nếu có, số request đã test và môi trường test cụ thể.

Em sẽ tránh trả lời theo kiểu cảm tính, vì với câu hỏi hiệu năng thì hội đồng thường hỏi rất kỹ.

## Slide 14. Chương 5 - Kết luận và hướng phát triển - 55 giây
Ở chương cuối, em tổng kết lại kết quả đạt được, hạn chế và hướng phát triển.

Kết quả đạt được là em đã xây dựng được một hệ thống marketplace đa vai trò, có đầy đủ các luồng từ tìm kiếm, đặt lịch, báo giá, chat, ví, đánh giá, tranh chấp đến quản trị. Điểm nổi bật của đề tài là chatbot AI và AI gợi ý dịch vụ.

Về hạn chế, em có thể nói ngắn về phần hiệu năng, phần AI và một số trải nghiệm mobile vẫn còn có thể cải thiện thêm.

Hướng phát triển tiếp theo là tối ưu hiệu năng, nâng cấp AI gợi ý, hoàn thiện mobile app và bổ sung thêm các phân tích dữ liệu sâu hơn.

## Slide 15. Cảm ơn - 20 giây
Em xin cảm ơn thầy cô và các bạn đã lắng nghe phần trình bày của em.

Em rất mong nhận được góp ý để hoàn thiện hệ thống tốt hơn. Em xin sẵn sàng trả lời các câu hỏi.

