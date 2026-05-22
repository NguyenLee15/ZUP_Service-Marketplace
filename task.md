# Danh sách tác vụ tối ưu hóa (Task Tracker)

## ⚡ Giai đoạn 1: Tối ưu hóa Frontend (Hoàn thành)
- [x] Cấu hình SWC compiler tự động loại bỏ `console.log` trong `next.config.mjs`
- [x] Chuyển component `RecentlyViewedServices` trên trang chủ sang Dynamic Import (Lazy Loading)
- [x] Kiểm tra và tối ưu hóa thẻ `<Image>` và các thuộc tính `sizes` trên trang chủ
- [x] Build thử nghiệm local và so sánh dung lượng First Load JS trước/sau khi tối ưu

## 🔍 Giai đoạn 2: Rà soát & Tối ưu hóa Backend (Hoàn thành)
- [x] Rà soát các API hiện có ở Backend (đặc biệt là API lấy danh sách và tìm kiếm) để phát hiện các query Prisma chạy chậm
- [x] Bổ sung database index (`@@index`) cho các trường truy vấn tần suất cao trong `schema.prisma`
- [x] Cài đặt caching Redis cho các API đọc dữ liệu tĩnh/ít thay đổi

## 🚀 Giai đoạn 3: Khắc phục cảnh báo PageSpeed Insights di động (Hoàn thành)
- [x] Sửa lỗi Chuỗi yêu cầu quan trọng bằng cách thêm subset `latin-ext` vào `Montserrat` font trong `fe/wed/app/layout.tsx` và xóa preload tĩnh
- [x] Nén hình ảnh thumbnail dịch vụ với `quality={70}` trong `fe/wed/app/components/services/UnifiedServiceCard.tsx`
- [x] Khắc phục độ trễ hiển thị phần tử LCP (2.110ms) bằng cách tắt Ken Burns CSS animation trên di động và chỉ chạy trên desktop (`md:animate-ken-burns`) trong `fe/wed/app/components/home/HeroSection.tsx`
- [x] Đẩy các thay đổi trực tiếp lên nhánh `main` để kích hoạt Vercel tự động deploy

## 🎨 Giai đoạn 4: Tối ưu hóa Lighthouse Mobile & Khắc phục lỗi tương phản, A11y (Hoàn thành)
- [x] Nâng độ tương phản màu sắc (Contrast Ratio >= 4.5:1)
  - [x] Cập nhật màu chữ của liên kết "Xem tất cả" trong `CategoryGrid.tsx`
  - [x] Cập nhật màu liên kết "Khám phá tất cả" trong `FeaturedServices.tsx`
  - [x] Loại bỏ opacity `/60` khỏi `text-muted-foreground/60` của các nhãn thông tin dưới footer (`CustomerFooter.tsx`) để hiển thị rõ nét hơn
  - [x] Sửa màu nhãn "Kết nối cộng đồng" trong `SocialWidgets.tsx` thành `text-glacier-blue`
- [x] Tối ưu hóa khả năng tiếp cận (Accessibility)
  - [x] Bổ sung thuộc tính `aria-label` cho Link nút "Đặt ngay" trong `UnifiedServiceCard.tsx`
- [x] Giảm First Load JS & Tránh tác vụ chặn Main-Thread
  - [x] Chuyển `RecentlyViewedServices` trong `page.tsx` sang lazy dynamic import `{ ssr: false }` -> Điều chỉnh thành `{ ssr: true }` để tương thích Server Component
  - [x] Chuyển `FeaturedServices` trong `page.tsx` sang dynamic import `{ ssr: true }`
  - [x] Chuyển `CustomerFooter` trong `page.tsx` sang dynamic import `{ ssr: true }`
- [x] Xác thực cục bộ (Typecheck và Build local thành công)
- [x] Push code lên GitLab nhánh `main` kích hoạt Vercel deploy

## 🛠️ Giai đoạn 5: Khắc phục lỗi Console 404 & Cấu hình Source Maps (Hoàn thành - Quyết định Người dùng)
- [x] Khắc phục lỗi 404 Vercel Analytics: Đã kích hoạt tính năng **Web Analytics** trên Vercel Dashboard của dự án (Giữ an toàn code).
- [x] Cấu hình Source Maps: Quyết định giữ tắt Source Maps ở production để bảo mật tối đa mã nguồn React components của dự án.

## ⚡ Giai đoạn 6: Tối ưu hóa hiệu năng LCP di động & Triệt tiêu biến động Backend (Hoàn thành)
- [x] Thêm thuộc tính `unoptimized` cho ảnh Hero background trong `HeroSection.tsx`
- [x] Chuyển đổi trang chủ sang Client-Side fetching động (tĩnh hóa trang chủ thành 100% Static Route) để triệt tiêu biến động TTFB do Backend
- [x] Chạy typecheck `npx tsc --noEmit --skipLibCheck` ở `fe/wed` thành công
- [x] Chạy build production local `npm run build` ở `fe/wed` để xác nhận thành công trang chủ là `Static Route (○ /)`
- [x] Commit thay đổi và push code lên GitLab nhánh `main` để Vercel tự động cập nhật
- [x] Cập nhật tệp walkthrough.md và báo cáo kết quả hoàn thành với điểm số kỷ lục tuyệt đối ổn định

## 📍 Giai đoạn 7: Chatbot Nhận Biết Vị Trí & Đề Xuất Thợ Gần Nhất (Đang thực hiện)
- [x] Task 1: Tiện ích tính khoảng cách Haversine (Backend Geo Utility)
  - [x] Step 1: Viết test kiểm thử cho hàm tính khoảng cách Haversine tại `Be/src/shared/utils/geo.spec.ts`
  - [x] Step 2: Tạo hàm tính khoảng cách Haversine tại `Be/src/shared/utils/geo.ts`
  - [x] Step 3: Chạy test và xác minh hàm hoạt động chính xác
  - [x] Step 4: Commit thay đổi lên Git
- [x] Task 2: Trích xuất Quận/Huyện từ tin nhắn văn bản (NLU Location Extraction Fallback)
  - [x] Step 1: Viết test cho phương thức trích xuất vị trí trong ChatbotService Spec
  - [x] Step 2: Triển khai phương thức trích xuất vị trí `extractDistrictFromText` ở ChatbotService
  - [x] Step 3: Chạy test và đảm bảo pass
  - [x] Step 4: Commit thay đổi
- [x] Task 3: Cập nhật Interface & DTO Vị Trí (Backend & Frontend Types)
  - [x] Step 1: Cập nhật các DTO/Interface phía Backend
  - [x] Step 2: Cập nhật định nghĩa Zod Schema phía Frontend
  - [x] Step 3: Commit thay đổi
- [x] Task 4: Tích hợp Tính khoảng cách & Dựng Prompt Nhận Biết Vị Trí (Backend Logic Integration)
  - [x] Step 1: Import hàm tính Haversine vào ChatbotService
  - [x] Step 2: Triển khai việc lấy tọa độ & tính khoảng cách của Thợ trong `prepareContext` & `findRelevantServices`
  - [x] Step 3: Tinh chỉnh hàm `buildServiceContext` để đưa khoảng cách vào prompt của Gemini
  - [x] Step 4: Chạy biên dịch kiểm tra tính đúng đắn ở Backend
  - [x] Step 5: Commit thay đổi
- [x] Task 5: Chia sẻ vị trí & Hiển thị Khoảng cách trực quan (Frontend UI/UX)
  - [x] Step 1: Bổ sung tọa độ GPS hiện tại vào `pageContext` gửi từ Frontend
  - [x] Step 2: Triển khai nút Quick Reply "📍 Chia sẻ vị trí" và gọi Geolocation API
  - [x] Step 3: Thiết kế Premium Badge Khoảng cách trên thẻ Dịch vụ
  - [x] Step 4: Chạy biên dịch Frontend Next.js để xác minh
  - [x] Step 5: Commit thay đổi và hoàn tất

## 💬 Giai đoạn 8: AI-to-Provider Chat Handover & Bộ chọn Ngày Giờ Trực Quan với Ràng Buộc Bảo Mật (Hoàn thành)
- [x] Triển khai **AI-to-Provider Chat Handover**:
  - [x] Chuyển tiếp an toàn sang chat với thợ realtime (`/chat?conversationId=...`) khi kết nối AI chatbot.
  - [x] Cơ chế tự động đóng Widget chatbot khi click mở liên kết chat/booking.
- [x] Triển khai **Interactive Date-Time Picker**:
  - [x] Form chọn ngày giờ trực quan lồng trong hội thoại khi tạo đơn nháp (`CREATE_BOOKING_DRAFT`).
  - [x] Chuyển đổi định dạng ngày giờ tiếng Việt thân thiện để LLM phân tích không bị lệch múi giờ (Timezone-safe).
- [x] Bổ sung các **Ràng buộc Bảo mật nâng cao**:
  - [x] Kiểm tra đăng nhập ngay tại nút hành động (Redirect sang `/login` nếu chưa đăng nhập).
  - [x] Lọc bỏ triệt để dịch vụ của các Thợ bị khóa (`provider.status !== ACTIVE`) hoặc dịch vụ bị ẩn trên cả Backend và Chatbot.
  - [x] Validate ngày giờ đặt lịch (`desiredTime`) ở Backend phải tối thiểu 2 giờ kể từ thời điểm hiện tại.
- [x] Bóc tách và hiển thị thông tin lỗi chi tiết của NestJS Exception trực tiếp trên Chatbot UI.
- [x] **Khắc phục lỗi build dự án (Build Failed - Command "npm run build" exited with 1)**:
  - [x] Bổ sung script `"build"` vào root `package.json` để kích hoạt build đồng bộ cả Backend (`Be/`) và Frontend Web (`fe/wed/`) ở thư mục gốc.
  - [x] Kiểm tra và xác minh biên dịch Next.js và NestJS thành công 100% không lỗi.
  - [x] Commit và push mã nguồn lên GitLab remote.
