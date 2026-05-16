# HƯỚNG DẪN KIỂM THỬ HỆ THỐNG HOMESERVE

Tài liệu này chi tiết các bước thực hiện, dữ liệu cần nhập và các nút cần bấm cho từng vai trò người dùng.

## 🔑 THÔNG TIN TÀI KHOẢN ĐĂNG NHẬP (Môi trường Test)

| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@system.com` | `password123` |
| **Khách hàng (Customer)** | `customer@demo.com` | `password123` |
| **Nhà cung cấp (Provider)** | `provider1@demo.com` | `password123` |
| **Nhà cung cấp 2 (Provider)** | `provider2@demo.com` | `password123` |

---

## I. VAI TRÒ: KHÁCH HÀNG (CUSTOMER)

### 1. Luồng: Tìm kiếm & Đặt lịch dịch vụ
- **Mục tiêu**: Đặt một dịch vụ sửa chữa điện nước.
- **Các bước thực hiện**:
    1.  **Truy cập**: Vào trang chủ `Home`.
    2.  **Tìm kiếm**: Nhập "Sửa ống nước" vào ô tìm kiếm AI hoặc chọn danh mục "Sửa chữa điện nước".
    3.  **Chọn dịch vụ**: Nhấn vào một dịch vụ hiển thị trong kết quả.
    4.  **Xem chi tiết**: Kiểm tra thông tin, giá tham khảo, đánh giá.
    5.  **Nhấn "Đặt lịch ngay"**:
        -   **Điền thông tin**:
            -   Địa chỉ: "123 Đường ABC, Quận 1".
            -   Ghi chú: "Ống nước bồn rửa bát bị rò rỉ".
            -   Thời gian mong muốn: Chọn ngày/giờ.
        -   **Nhấn "Xác nhận đặt đơn"**.
- **Kết quả mong đợi**: Hệ thống báo "Đặt đơn thành công". Trạng thái đơn là `PENDING`.

### 2. Luồng: Xác nhận báo giá & Hoàn thành
- **Mục tiêu**: Đồng ý với giá thợ đưa ra và kết thúc đơn.
- **Các bước thực hiện**:
    1.  **Vào "Đơn hàng của tôi"**: Tìm đơn ở trạng thái `QUOTED`.
    2.  **Xem báo giá**: Nhấn vào đơn để xem số tiền thực tế thợ đã gửi.
    3.  **Nhấn "Xác nhận báo giá"**: 
        -   Trạng thái đơn chuyển sang `CONFIRMED`.
    4.  **Chờ thợ làm việc**: Khi thợ nhấn "Hoàn thành" (đơn chuyển sang `DONE`).
    5.  **Nhấn "Xác nhận hoàn thành"**: (Hoặc chờ 24h hệ thống tự chốt).
        -   **Đánh giá**: Nhập số sao (5*) và nội dung "Thợ nhiệt tình, sửa tốt".
        -   **Nhấn "Gửi đánh giá"**.
- **Kết quả mong đợi**: Đơn hàng có ghi nhận `auto_completed_at`.

---

## II. VAI TRÒ: NHÀ CUNG CẤP (PROVIDER)

### 1. Luồng: Tiếp nhận & Báo giá đơn hàng
- **Mục tiêu**: Nhận đơn từ khách và gửi báo giá thực tế.
- **Các bước thực hiện**:
    1.  **Vào "Quản lý đơn hàng"**: Tìm đơn ở trạng thái `PENDING`.
    2.  **Nhấn "Gửi báo giá"**:
        -   **Nhập giá thực tế**: "500.000 VNĐ".
        -   **Nhập ghi chú**: "Bao gồm phí thay vòi nước mới".
        -   **Nhấn "Xác nhận gửi"**.
- **Kết quả mong đợi**: Đơn chuyển sang `QUOTED`.

### 2. Luồng: Thực hiện & Kết thúc đơn
- **Mục tiêu**: Cập nhật tiến độ thi công.
- **Các bước thực hiện**:
    1.  **Bắt đầu làm**: Khi đến nhà khách, nhấn **"Bắt đầu thực hiện"**. 
        -   Trạng thái đơn chuyển sang `IN_PROGRESS`.
    2.  **Hoàn thành**: Sau khi sửa xong, nhấn **"Hoàn thành công việc"**.
        -   Trạng thái đơn chuyển sang `DONE`.
        -   Ghi nhận `completed_at`.
- **Kết quả mong đợi**: Hệ thống ghi nhận thời điểm hoàn thành, bắt đầu đếm ngược 24h để trừ hoa hồng.

### 3. Luồng: Nạp tiền vào ví (VNPay)
- **Mục tiêu**: Đảm bảo số dư ví không bị âm để tiếp tục nhận đơn.
- **Các bước thực hiện**:
    1.  **Vào "Ví của tôi"**: Nhấn **"Nạp tiền"**.
    2.  **Nhập số tiền**: "200.000".
    3.  **Nhấn "Thanh toán qua VNPay"**: Hệ thống chuyển sang trang VNPay.
    4.  **Giả lập thanh toán**: Chọn ngân hàng NCB, nhập số thẻ test VNPay.
    5.  **Nhấn "Xác nhận"**: Quay lại HomeServe.
- **Kết quả mong đợi**: Số dư ví tăng thêm 200.000. Trạng thái `is_restricted = false` nếu trước đó bị khóa.

---

## III. VAI TRÒ: QUẢN TRỊ VIÊN (ADMIN)

### 1. Luồng: Giải quyết tranh chấp (Dispute)
- **Mục tiêu**: Xử lý khi khách hàng khiếu nại thợ.
- **Các bước thực hiện**:
    1.  **Vào "Quản lý tranh chấp"**: Tìm đơn có trạng thái `DISPUTED`.
    2.  **Xem bằng chứng**: Đọc nội dung khiếu nại của khách và phản hồi của thợ.
    3.  **Đưa ra phán quyết**:
        -   **Option A: "Hoàn thành đơn" (COMPLETE)**: Nếu thợ làm đúng -> Trừ hoa hồng thợ như bình thường.
        -   **Option B: "Phạt thợ" (PENALIZE)**: Nếu thợ sai -> Trừ tiền phạt từ ví thợ, có thể khóa tài khoản thợ.
    4.  **Nhấn "Xác nhận phán quyết"**.
- **Kết quả mong đợi**: Trạng thái Dispute chuyển sang `RESOLVED`. Booking giữ nguyên trạng thái `DISPUTED`.

---

## CÁC QUY TẮC NGHIỆM THU (CHECKLIST)
- [ ] Không thể hủy đơn sau khi đã `CONFIRMED`.
- [ ] Ví âm tiền -> Không thể nhận đơn mới (`is_restricted = true`).
- [ ] Mọi lỗi trả về phải có định dạng `{ code, message }`.
- [ ] Thông tin nhạy cảm (KYC) phải được bảo mật.
