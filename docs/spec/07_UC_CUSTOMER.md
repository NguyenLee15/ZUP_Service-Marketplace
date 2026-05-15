<!-- FILE: 07_UC_CUSTOMER.md | SCOPE: UC16 Booking KH · UC17 Đánh giá & Tranh chấp KH -->

## UC16 – QUẢN LÝ BOOKING CÁ NHÂN (KHÁCH HÀNG) {#uc16}

### UC16.1 – Xem danh sách và chi tiết booking

**Actor:** Khách hàng | **Priority:** Cao

**Bộ lọc:** chờ xác nhận / đã báo giá / đã xác nhận / đang thực hiện / hoàn thành / đã hủy / có tranh chấp.

**Chi tiết:** Mã booking, tên dịch vụ, mô tả yêu cầu, địa chỉ, thời gian mong muốn, trạng thái, báo giá (nếu có), surveyor_name (nếu đã có — từ UC12.2).

**Ghi chú:** Điểm vào cho UC16.3, UC16.4, UC16.5, UC17.1, UC17.2.

---

### UC16.2 – Tạo booking mới

**Actor:** Khách hàng (đã đăng nhập) | **Priority:** Cao

**Form:** Mô tả chi tiết yêu cầu (bắt buộc), Địa chỉ thực hiện (bắt buộc), Thời gian mong muốn (bắt buộc, phải là thời điểm trong tương lai).

**Luồng thay thế 1.1:** Chọn địa chỉ từ danh sách đã lưu (UC03.3) → tự động điền form.

**Business Rules:**
- BR1: Thời gian mong muốn phải > thời điểm hiện tại
- BR2: Booking khởi tạo luôn ở trạng thái "Chờ xác nhận"
- BR3: Không cần thanh toán tại bước này. KH thanh toán trực tiếp (tiền mặt/chuyển khoản) cho thợ sau khi hoàn thành; hệ thống mới trừ hoa hồng từ ví NCC.

---

### UC16.3 – Xác nhận / từ chối báo giá

**Actor:** Khách hàng | **Priority:** Cao

**Mô tả:** KH xem báo giá (giá thực tế, thời gian dự kiến, ghi chú/ảnh khảo sát) → quyết định.

**Xác nhận:** Trạng thái → "Đã xác nhận" → thông báo NCC bắt đầu thi công.

**Từ chối (AF 1.1):** Chọn/nhập lý do → trạng thái → "Đã hủy" → thông báo NCC kèm lý do.

**Business Rules:**
- BR1: Validate guard: chỉ KH của booking đó mới được thực hiện thao tác này
- BR2: Sau khi "Đã xác nhận" → NCC bắt buộc thực hiện, không tự hủy đơn phương
- BR3: Không tích hợp cổng thanh toán tại bước này

---

### UC16.4 – Hủy booking

**Actor:** Khách hàng | **Priority:** Trung bình

**Điều kiện:** Chỉ khi booking ở "Chờ xác nhận" hoặc "Đã báo giá". KH chọn/nhập lý do từ danh sách gợi ý.

**Business Rules:**
- BR1: Nút "Hủy yêu cầu" chỉ hiển thị với 2 trạng thái trên
- BR2: Từ "Đã xác nhận" trở đi → KH không tự hủy đơn phương; phải dùng UC09 (Khiếu nại)

---

### UC16.5 – Đặt lại nhanh từ booking cũ

**Actor:** Khách hàng | **Priority:** Thấp

**Mô tả:** KH tái sử dụng dữ liệu booking đã hoàn thành/đã hủy. Hệ thống tự điền sẵn: tên dịch vụ, địa chỉ, mô tả yêu cầu. KH chỉ cần chọn lại thời gian.

**Business Rules:**
- BR1: Nút "Đặt lại" chỉ xuất hiện tại booking đã "Hoàn thành" hoặc "Đã hủy"
- BR2: Dịch vụ phải đang "Đang hoạt động"
- BR3: Giao dịch mới có ID riêng, không kế thừa lịch sử/báo giá từ giao dịch gốc

---

## UC17 – ĐÁNH GIÁ VÀ TRANH CHẤP (KHÁCH HÀNG) {#uc17}

### UC17.1 – Đánh giá dịch vụ

**Actor:** Khách hàng | **Priority:** Trung bình

**Điều kiện:** Chỉ kích hoạt khi booking ở trạng thái "Hoàn thành". Mỗi booking chỉ được đánh giá **một lần duy nhất**.

**Form:** Chọn số sao 1–5 (bắt buộc), nội dung nhận xét (tùy chọn).

**Sau khi gửi:** Lưu đánh giá → tính lại điểm TB dịch vụ → ẩn nút đánh giá → hiển thị công khai tại UC15.2 và UC11.5.

---

### UC17.2 – Nghiệm thu kết quả

**Actor:** Khách hàng | **Priority:** Cao

**Mô tả:** Sau khi NCC đánh dấu "Hoàn thành" → KH có **24 giờ** để nghiệm thu. Nếu không phản hồi → hệ thống tự động nghiệm thu thành công.

**Xác nhận hoàn thành:**
1. KH xem hình ảnh/ghi chú kết quả từ thợ + đồng hồ đếm ngược
2. Nhấn "Nghiệm thu & Hoàn thành" → xác nhận
3. Trong `prisma.$transaction()`: ghi `auto_completed_at = NOW()` vào booking + trừ hoa hồng từ ví NCC + ghi audit log (booking vẫn giữ `status = DONE`)

**Phản đối / Khiếu nại (AF 1.1):**
1. Nhấn "Phản đối / Khiếu nại"
2. Nhập lý do + tải lên hình ảnh/video bằng chứng (bắt buộc) → lưu vào bảng `dispute_evidences` (type: IMAGE|VIDEO, file_url) — xem FS04 cho upload failure
3. Chuyển trạng thái → "Có tranh chấp" (Disputed) trong DB transaction
4. Gửi thông báo khẩn cấp cho Admin → UC09.2

**Tự động nghiệm thu (AF 1.2 – Cronjob):** Cronjob kiểm tra định kỳ → atomic UPDATE (xem FS05) → nếu thành công → trừ hoa hồng trong transaction (xem FS06).

**Failure scenarios:** FS05 (cronjob chạy 2 lần), FS06 (transaction không nguyên tử).

**Business Rules:**
- BR1: 24 giờ là thời gian vàng để phản đối. Hệ thống tính `auto_completed_at = completed_at + 24h` tại thời điểm NCC bấm DONE
- BR2: Khi chuyển sang `DISPUTED` → KHÔNG trừ hoa hồng; booking giữ status `DISPUTED` sau cả phán quyết; hoãn đến khi Admin phán quyết
- BR3: Nếu sau trừ hoa hồng mà ví NCC âm → vẫn ghi lệnh trừ (ghi nợ) + cắm cờ `is_restricted = true` tài khoản NCC (ẩn dịch vụ, không nhận khách mới) + yêu cầu nạp tiền để mở khóa

**Ghi chú UX:** Hệ thống gửi thông báo nhắc nhở khi đồng hồ còn 6 giờ.

---

