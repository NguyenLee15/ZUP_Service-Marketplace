<!-- FILE: 04_UC_PROVIDER.md | SCOPE: UC11 Dịch vụ NCC · UC12 Booking/Báo giá NCC · UC13 Báo cáo NCC -->

## UC11 – QUẢN LÝ DỊCH VỤ CÁ NHÂN (NHÀ CUNG CẤP) {#uc11}

### UC11.1 – Xem danh sách dịch vụ cá nhân

**Actor:** Nhà cung cấp (đã KYC) | **Priority:** Trung bình

**Hiển thị:** Tên dịch vụ, ảnh đại diện, giá cơ bản, trạng thái duyệt (Chờ duyệt / Đang hoạt động / Đã ẩn / Bị từ chối).

**Business Rules:**
- BR1: Tenant Isolation – chỉ hiển thị dịch vụ của NCC đang đăng nhập
- BR2: Phân trang bắt buộc

**Ghi chú:** Điểm vào cho UC11.2, UC11.3, UC11.4, UC11.5.

---

### UC11.2 – Thêm dịch vụ mới

**Actor:** Nhà cung cấp | **Priority:** Cao

**Form:** Tên (bắt buộc), Mô tả chi tiết (Rich Text Editor, bắt buộc), Danh mục (bắt buộc), Khu vực phục vụ – Tỉnh/Quận (bắt buộc), Hình ảnh (1–5 ảnh, bắt buộc ít nhất 1), Giá tham khảo.

**Hai luồng lưu:**
- **Gửi duyệt:** Kiểm tra đầy đủ trường bắt buộc → trạng thái "Chờ duyệt" → thông báo Admin
- **Lưu nháp:** Chỉ bắt buộc Tên → trạng thái "Bản nháp" (không thông báo Admin)

**Business Rules:**
- BR1: Trường bắt buộc khi gửi duyệt: Tên, Mô tả, Danh mục, Khu vực
- BR2: Ảnh: JPG/PNG, ≤ 5MB/ảnh, 1–5 ảnh; ảnh đầu tiên là ảnh bìa
- BR3: Luồng trạng thái: Tạo mới → Bản nháp → Chờ duyệt (NCC không tự kích hoạt được)

**Failure scenario:** Xem FS04 cho trường hợp upload ảnh thất bại giữa chừng.

---

### UC11.3 – Cập nhật thông tin dịch vụ

**Actor:** Nhà cung cấp | **Priority:** Trung bình

**Quy tắc tái kiểm duyệt (BR2):** Dịch vụ đang "Đang hoạt động" sau khi cập nhật → bắt buộc chuyển về "Chờ duyệt" (cảnh báo người dùng trước). Dịch vụ "Bị từ chối" sau cập nhật → tự động "Chờ duyệt".

**Dịch vụ đang "Đã ẩn" hoặc "Bản nháp" sau cập nhật → giữ nguyên trạng thái.**

**Nút "Lưu cập nhật"** chỉ enable khi phát hiện có thay đổi dữ liệu so với bản gốc.

---

### UC11.4 – Ẩn / ngừng cung cấp dịch vụ

**Actor:** Nhà cung cấp | **Priority:** Trung bình

**Mô tả:** Chuyển trạng thái "Đang hoạt động" ↔ "Đã ẩn". Dịch vụ ẩn biến mất khỏi kết quả tìm kiếm nhưng vẫn giữ dữ liệu và lịch sử.

**Business Rules:**
- BR1: NCC chỉ thao tác trên dịch vụ của mình
- BR2: Dịch vụ trong danh sách yêu thích của KH → gắn nhãn "Tạm ngừng cung cấp", không cho đặt lịch
- BR3: Chỉ áp dụng với "Đang hoạt động" hoặc "Đã ẩn". Dịch vụ "Chờ duyệt" hoặc "Bị từ chối" không dùng được chức năng này

---

### UC11.5 – Xem đánh giá từ khách hàng

**Actor:** Nhà cung cấp | **Priority:** Thấp

**Hiển thị:** Điểm sao trung bình (X/5), biểu đồ phân bổ sao (1–5 sao), danh sách đánh giá (tên KH ẩn danh một phần, số sao, nội dung, hình ảnh, ngày gửi).

**Bộ lọc:** Sắp xếp mới nhất/cũ nhất; lọc theo số sao.

**Business Rules:**
- BR1: Chỉ hiển thị đánh giá từ booking trạng thái "Hoàn thành"
- BR2: Quyền sở hữu – không xem đánh giá của NCC khác
- BR3: NCC chỉ xem (read-only), không xóa/chỉnh sửa đánh giá

---

## UC12 – QUẢN LÝ BOOKING VÀ BÁO GIÁ (NHÀ CUNG CẤP) {#uc12}

### UC12.1 – Xem danh sách và chi tiết booking

**Actor:** Nhà cung cấp | **Priority:** Cao

**Ưu tiên hiển thị:** "Chờ xác nhận" hiển thị trên cùng.

**Chi tiết booking:** Mã booking, thông tin KH, mô tả yêu cầu, địa chỉ, thời gian mong muốn, trạng thái, báo giá (nếu có), surveyor_name (nếu đã có — từ UC12.2).

**Business Rules:**
- BR1: Tenant Isolation – chỉ xem booking thuộc dịch vụ của NCC đang đăng nhập
- BR2: Phân trang bắt buộc

**Ghi chú:** Điểm vào cho UC12.2, UC12.3, UC12.4, UC12.5.

---

### UC12.2 – Xác nhận booking

**Actor:** Nhà cung cấp | **Priority:** Cao

**Mô tả:** NCC xem mô tả, thời gian, địa chỉ → nếu đồng ý, nhập surveyor_name và SĐT người đến → KH nhận thông báo kèm thông tin người sẽ đến.

**Lưu ý:** Hành động này **không thay đổi trạng thái** booking (vẫn là "Chờ xác nhận") cho đến khi hoàn tất báo giá (UC12.3).

**Luồng thay thế 1.1 – NCC tự đến:** Nhấn "Tôi sẽ tự đến" → hệ thống tự điền tên + SĐT từ hồ sơ cá nhân.

**Business Rules:**
- BR1: Bắt buộc: Tên và SĐT người đến
- BR2: Thông tin người khảo sát hiển thị cố định trong chi tiết giao dịch của KH

---

### UC12.3 – Tạo và gửi báo giá

**Actor:** Nhà cung cấp | **Priority:** Cao

**Điều kiện:** Booking ở trạng thái "Chờ xác nhận" VÀ đã có thông tin "người đến khảo sát" từ UC12.2.

**Form báo giá:** `actual_price` (bắt buộc, > 0 — lưu vào `quotations.actual_price`), Thời gian dự kiến (bắt buộc), Ghi chú mô tả hạng mục (tùy chọn), Hình ảnh biên bản khảo sát (tùy chọn).

**Khi gửi báo giá thành công:**
- Lưu báo giá + **chốt (snapshot) tỉ lệ hoa hồng** tại thời điểm này (bất biến)
- Chuyển trạng thái → "Đã báo giá"
- Thông báo đẩy + email cho KH

**Business Rules:**
- BR1: Giá thực tế > 0, không âm
- BR2: Giá thực tế độc lập với "Giá tham khảo" ban đầu
- BR3: Tại thời điểm gửi báo giá: lấy rate hiện tại từ `commission_configs` → lưu vào `quotations.commission_rate_snapshot` (bất biến) – không bị ảnh hưởng nếu Admin thay đổi phí sau này (xem UC10.3)
- BR4: Sau khi gửi, NCC không tự sửa báo giá được

---

### UC12.4 – Cập nhật trạng thái booking

**Actor:** Nhà cung cấp | **Priority:** Cao

**Luồng trạng thái một chiều:** `Đã xác nhận` → `Đang thực hiện` → `Hoàn thành`

**Khi nhấn "Hoàn thành":** Bắt buộc tải lên ít nhất 1 ảnh kết quả công việc → kích hoạt bộ đếm ngược 24 giờ nghiệm thu cho KH.

**Business Rules:**
- BR1: Mỗi chuyển trạng thái validate theo state machine guard (xem bảng ở phần Tổng quan)
- BR2: KH có đúng 24 giờ để xác nhận hoặc phản đối
- BR3: Nếu KH không phản hồi sau 24h → hệ thống tự động nghiệm thu thành công + chuyển tiền (xem FS05 cho idempotency)
- BR4: Thao tác hoàn thành + ảnh đính kèm lưu vĩnh viễn vào audit log

**Failure scenario:** Xem FS04 (upload ảnh thất bại), FS05 (cronjob chạy 2 lần), FS06 (trừ hoa hồng không nguyên tử).

---

### UC12.5 – Hủy booking

**Actor:** Nhà cung cấp | **Priority:** Trung bình

**Điều kiện hủy:** Chỉ khi booking ở trạng thái "Chờ xác nhận" hoặc "Đã báo giá".

**Bắt buộc nhập lý do** → thông báo cho KH kèm lý do.

**Business Rules:**
- BR1: Chỉ hủy được 2 trạng thái trên
- BR2: Từ trạng thái "Đã xác nhận" trở đi → NCC tuyệt đối không tự hủy đơn phương
- BR3: Lý do hủy bắt buộc
- BR4: Lý do hủy ghi vào `booking_status_histories` (field `note`) để đối soát lịch sử hủy của NCC

---

## UC13 – BÁO CÁO CÁ NHÂN VÀ HIỆU SUẤT (NHÀ CUNG CẤP) {#uc13}

### UC13.1 – Xem doanh thu và lịch sử giao dịch ví

**Actor:** Nhà cung cấp | **Priority:** Trung bình

**Hiển thị:**
- **Tổng quan tài chính:** Số dư ví hiện tại (nổi bật), Tổng doanh thu, Tổng phí hoa hồng đã trả
- **Line Chart:** Xu hướng doanh thu theo thời gian
- **Lịch sử giao dịch ví** (phân trang): Thời gian, loại giao dịch, mã tham chiếu, số tiền

**Phân loại dòng tiền:**
- Nạp tiền: màu xanh (+)
- Trừ hoa hồng: màu đỏ (-) kèm link đến booking tương ứng

**Business Rules:**
- BR1: Chỉ cộng dồn từ giao dịch "Hoàn thành"
- BR3: Mỗi dòng "Trừ hoa hồng" gắn kèm Booking ID để đối soát

---

### UC13.2 – Xem thống kê booking

**Actor:** Nhà cung cấp | **Priority:** Trung bình

**KPI Cards:** Tổng số lịch đặt, Tỉ lệ hủy đơn (%), Điểm đánh giá trung bình toàn gian hàng.

**Pie Chart:** Tỉ trọng giao dịch theo trạng thái.

**Bảng xếp hạng:** Top dịch vụ có số lượng lượt đặt "Hoàn thành" cao nhất.

**Công thức Tỉ lệ hủy:** `(Số GD Đã hủy / Tổng số GD khởi tạo) * 100` (gồm cả đơn NCC tự hủy và KH hủy).

---

### UC13.3 – Xuất báo cáo Excel / PDF

Tương tự UC10.4 nhưng cho dữ liệu cá nhân NCC. Header PDF bao gồm: Tên gian hàng, loại báo cáo, khoảng thời gian.

---

