<!-- FILE: 02_UC_AUTH.md | SCOPE: UC01 Đăng ký · UC02 Đăng nhập/Đăng xuất/Quên MK · UC03 Hồ sơ cá nhân -->

## UC01 – ĐĂNG KÝ TÀI KHOẢN {#uc01}

### UC01.1 – Đăng ký tài khoản

**Actor:** Khách hàng, Nhà cung cấp | **Priority:** Cao

**Mô tả:** Người dùng điền form đăng ký có tích hợp reCAPTCHA ẩn và xác thực email bằng OTP 6 số. Hệ thống chỉ tạo tài khoản sau khi OTP hợp lệ (không tạo trước).

**Điều kiện tiên quyết:**
- Người dùng chưa có tài khoản
- Người dùng chưa đăng nhập

**Kết quả sau:**
- Tài khoản tạo thành công ở trạng thái hoạt động
- Khách hàng → chuyển hướng trang đăng nhập
- Nhà cung cấp → chuyển hướng trang nộp hồ sơ KYC (UC01.2)

**Luồng chính:**
1. Truy cập trang đăng ký
2. Hiển thị form: Họ tên, Email, OTP (ô nhập + nút Gửi mã), Số điện thoại, Mật khẩu, Xác nhận mật khẩu, Vai trò (mặc định: Khách hàng)
3. Người dùng điền thông tin, hệ thống kiểm tra real-time khi chuyển ô
4. Nhập email hợp lệ → nhấn "Gửi mã"
5. Hệ thống xác thực reCAPTCHA ngầm, kiểm tra email tồn tại, giới hạn spam → gửi OTP 6 số qua email + đếm ngược 60 giây
6. Người dùng nhập OTP vào form
7. Nhấn "Đăng ký" → hệ thống kiểm tra toàn bộ dữ liệu + OTP
8. Tạo tài khoản thành công → thông báo + chuyển hướng

**Luồng thay thế 1.1 – Gửi lại OTP:**
- Nhấn "Gửi lại mã" (chỉ sáng khi hết cooldown)
- Kiểm tra giới hạn gửi OTP ngày (E8)
- Vô hiệu hóa mã cũ, gửi mã mới, reset đếm ngược

**Ngoại lệ:**

| Mã | Tình huống | Xử lý |
|---|---|---|
| E1 | Trường bắt buộc để trống | Báo lỗi dưới từng trường, chặn đăng ký |
| E2 | Sai định dạng | Báo lỗi real-time; nếu lỗi email: chặn nút gửi mã |
| E3 | Email đã tồn tại | Báo lỗi dưới ô email, chặn nút gửi mã |
| E4 | Số điện thoại đã tồn tại | Báo lỗi, yêu cầu nhập số khác |
| E5 | Mật khẩu không khớp | Cảnh báo real-time |
| E6 | OTP sai hoặc hết hạn | Cảnh báo, không tạo tài khoản; sai >5 lần → E9 |
| E7 | Gửi mã trong cooldown | Nút mờ, hiển thị đếm ngược |
| E8 | Vượt giới hạn gửi OTP/ngày | Chặn gửi email 24 giờ |
| E9 | Spam OTP liên tiếp | Khóa form 15 phút |

**Business Rules:**
- BR1: Họ tên ≤ 50 ký tự, không ký tự đặc biệt
- BR2: Email và SĐT đúng chuẩn Việt Nam
- BR3: Mật khẩu 8–30 ký tự, có chữ hoa/thường/số/ký tự đặc biệt
- BR4: OTP 6 số, hiệu lực 10 phút
- BR5: Rate limit OTP: cooldown 60s, tối đa 5 lần/ngày; nhập sai tối đa 5 lần
- BR6: Bắt buộc reCAPTCHA ẩn trước khi gọi API gửi mail
- BR7: Chỉ tạo tài khoản khi OTP hợp lệ
- BR8: Khi tạo tài khoản thành công: `users.email_verified = true`, `users.status = ACTIVE` (không tạo trước rồi xác thực sau)

**Ghi chú kỹ thuật:** Form OTP auto-focus ô tiếp theo, hỗ trợ paste toàn bộ mã. Nút "Gửi mã" chỉ kích hoạt khi email hợp lệ.

---

### UC01.2 – Nộp hồ sơ KYC

**Actor:** Nhà cung cấp | **Priority:** Cao

**Mô tả:** Nhà cung cấp tải lên giấy tờ tùy thân và chứng chỉ hành nghề để Admin xét duyệt. Hệ thống hỗ trợ xem trước file, lưu cloud, khóa form khi đang chờ duyệt.

**Điều kiện tiên quyết:**
- Đã đăng ký với vai trò Nhà cung cấp
- Email đã xác thực
- KYC chưa nộp hoặc đã bị từ chối

**Kết quả sau:**
- File tải lên cloud, dữ liệu hồ sơ lưu DB trạng thái "chờ duyệt"
- Gửi thông báo đến Admin
- Nhà cung cấp nhận xác nhận nộp thành công

**Luồng chính:**
1. Truy cập trang nộp hồ sơ KYC
2. Hiển thị form yêu cầu các giấy tờ
3. Chọn ảnh CCCD mặt trước + mặt sau → hiển thị preview
4. Chọn chứng chỉ hành nghề (nếu có) → preview
5. Chọn ảnh chân dung → preview
6. Nhấn "Nộp hồ sơ"
7. Hệ thống kiểm tra dung lượng, định dạng, trạng thái hồ sơ
8. Đẩy file lên cloud (private, không public URL), lưu trạng thái "chờ duyệt" trong cùng một transaction (xem FS04)
9. Hiển thị thông báo nộp thành công

**Luồng thay thế 1.1 – Nộp lại sau khi bị từ chối:**
- Đăng nhập, vào trang KYC
- Hệ thống hiển thị lý do từ chối từ Admin
- Tải lại file chưa đạt → nhấn "Nộp lại hồ sơ" → tiếp bước 7

**Ngoại lệ:**

| Mã | Tình huống | Xử lý |
|---|---|---|
| E1 | Thiếu tài liệu bắt buộc | Báo lỗi, vô hiệu hóa nút nộp |
| E2 | File sai định dạng | Báo lỗi real-time, không hiển thị preview |
| E3 | File > 5MB | Báo lỗi real-time, không hiển thị preview |
| E4 | Hồ sơ đang chờ duyệt (chống spam) | Chặn nộp, báo lỗi "đang được xử lý" |
| E5 | Cloud upload thành công nhưng DB thất bại | Hệ thống tự động xóa file trên cloud (compensation), báo lỗi "Nộp thất bại, vui lòng thử lại" |

**Business Rules:**
- BR1: CCCD hai mặt + ảnh chân dung là bắt buộc
- BR2: File: JPG/PNG/PDF, tối đa 5MB/file
- BR3: NCC chưa duyệt KYC không được tạo/chỉnh sửa dịch vụ
- BR4: Không giới hạn số lần nộp lại sau từ chối; không được nộp đúp khi đang chờ duyệt
- BR5: File KYC lưu dưới dạng private storage — URL truy cập là pre-signed URL TTL ≤ 1 giờ, chỉ cấp cho Admin/Staff có phiên hợp lệ

---

## UC02 – ĐĂNG NHẬP, ĐĂNG XUẤT, QUÊN MẬT KHẨU {#uc02}

### UC02.1 – Đăng nhập bằng email và mật khẩu

**Actor:** Người dùng | **Priority:** Cao

**Mô tả:** Đăng nhập bằng email/mật khẩu. Hệ thống cấp access token (ngắn hạn) và refresh token (HTTP-only cookie), sau đó chuyển hướng theo vai trò và trạng thái KYC.

**Điều kiện tiên quyết:**
- Đã có tài khoản, đã xác thực email, tài khoản đang hoạt động

**Kết quả sau:**
- Cấp access token + refresh token
- Ghi nhận phiên đăng nhập
- Chuyển hướng trang chính theo vai trò

**Luồng chính:**
1. Truy cập trang đăng nhập
2. Hiển thị form (có tùy chọn "Nhớ mật khẩu")
3. Nhập email, mật khẩu → kiểm tra real-time định dạng; nút "Đăng nhập" chỉ enable khi dữ liệu hợp lệ
4. Nhấn đăng nhập → kiểm tra thông tin
5. Cấp token → chuyển hướng theo vai trò

**Luồng thay thế 1.1 – NCC đăng nhập khi KYC chưa duyệt:**
- Xác thực thành công nhưng KYC chưa qua → chuyển hướng trang trạng thái KYC
- Chờ duyệt: hiển thị thông báo chờ
- Bị từ chối: hiển thị lý do + nút "Nộp lại hồ sơ" (→ UC01.2 AF1.1)

**Ngoại lệ:**

| Mã | Tình huống | Xử lý |
|---|---|---|
| E1 | Trường để trống / sai định dạng | Báo lỗi real-time, vô hiệu hóa nút đăng nhập |
| E2 | Email/mật khẩu sai | Thông báo chung "Email hoặc mật khẩu không đúng"; sai 5 lần → khóa 15 phút |
| E3 | Tài khoản chưa xác thực email | Hiển thị nút "Gửi lại mã xác thực" |
| E4 | Tài khoản bị khóa | Thông báo liên hệ hỗ trợ |

**Business Rules:**
- BR1: Không tiết lộ cụ thể sai email hay sai mật khẩu
- BR2: Access token hết hạn 15–30 phút; refresh token lưu HTTP-only cookie
- BR3: Chỉ tài khoản đã xác thực và đang hoạt động mới đăng nhập được
- BR4: Sai 5 lần liên tiếp → khóa 15 phút, tự động mở sau thời gian này

---

### UC02.2 – Đăng xuất và vô hiệu hóa phiên

**Actor:** Người dùng | **Priority:** Trung bình

**Mô tả:** Đăng xuất, xóa refresh token trên server, xóa cookie bảo mật + cache chatbot.

**Luồng chính:**
1. Nhấn nút đăng xuất
2. Gọi API đăng xuất lên server
3. Server tìm và xóa refresh token khỏi DB
4. Server trả về thành công → client xóa HTTP-only cookie
5. Client xóa trạng thái cục bộ (access token, phiên chat AI)
6. Chuyển hướng về trang đăng nhập

**Ngoại lệ E1:** Phiên đã hết hạn trước khi nhấn đăng xuất → server lỗi → client vẫn thực hiện bước 5–6.

**Business Rules:**
- BR1: Sau đăng xuất, refresh token bị xóa vĩnh viễn
- BR2: Mọi request sau đó dùng access token cũ đều bị từ chối

**Ghi chú thiết kế:** Không cần Redis blacklist; xóa token trực tiếp từ DB để tiết kiệm chi phí.

---

### UC02.3 – Quên mật khẩu (đặt lại qua email)

**Actor:** Người dùng | **Priority:** Cao

**Mô tả:** Nhập email → nhận link đặt lại (reCAPTCHA bảo vệ). Link có hiệu lực 15 phút, dùng một lần. Sau đặt lại thành công, toàn bộ phiên cũ bị thu hồi.

**Kết quả sau:**
- Mật khẩu mới được cập nhật
- Toàn bộ refresh token cũ bị vô hiệu hóa
- Chuyển hướng trang đăng nhập

**Luồng chính:**
1. Nhấn "Quên mật khẩu" → form nhập email
2. Nhập email → nhấn "Gửi"
3. reCAPTCHA ngầm + kiểm tra giới hạn gửi (E7)
4. Kiểm tra email tồn tại (E1)
5. Gửi link + hiển thị "Kiểm tra hộp thư"
6. Người dùng nhấn link trong email
7. Kiểm tra hợp lệ link (E2, E3)
8. Hiển thị form mật khẩu mới + xác nhận
9. Nhập mật khẩu (E4, E5, E6) → xác nhận
10. Cập nhật mật khẩu, thu hồi toàn bộ phiên cũ
11. Thông báo thành công → chuyển về đăng nhập

**Luồng thay thế 1.1 – Gửi lại link:** Form tự điền sẵn email cũ, vô hiệu hóa link cũ, tạo link mới.

**Ngoại lệ:**

| Mã | Tình huống | Xử lý |
|---|---|---|
| E1 | Email không tồn tại | Thông báo trung tính (không tiết lộ email có hay không) |
| E2 | Link hết hạn | Cảnh báo + nút gửi lại |
| E3 | Link không hợp lệ / đã dùng | Cảnh báo + nút gửi lại |
| E4 | Mật khẩu sai định dạng | Báo lỗi real-time, vô hiệu hóa nút |
| E5 | Mật khẩu xác nhận không khớp | Báo lỗi real-time |
| E6 | Mật khẩu mới trùng mật khẩu cũ | Cảnh báo khi nhấn nút |
| E7 | Vượt giới hạn yêu cầu đặt lại | Chặn gửi email, thông báo thử lại sau 30 phút |

**Business Rules:**
- BR1: Link hiệu lực 15 phút
- BR2: Link chỉ dùng một lần
- BR3: Sau đặt lại thành công → thu hồi toàn bộ refresh token cũ ngay lập tức
- BR4: Mật khẩu mới 8–30 ký tự, có hoa/thường/số/ký tự đặc biệt
- BR5: Mật khẩu mới ≠ mật khẩu hiện tại
- BR6: Rate limit: tối đa 3 lần yêu cầu/email trong 30 phút
- BR7: Bắt buộc reCAPTCHA ẩn trước khi gọi API gửi link

---

## UC03 – QUẢN LÝ HỒ SƠ CÁ NHÂN {#uc03}

### UC03.1 – Xem và cập nhật thông tin cá nhân

**Actor:** Người dùng | **Priority:** Trung bình

**Mô tả:** Cập nhật họ tên, số điện thoại, ảnh đại diện. Email bị khóa, không thể thay đổi.

**Luồng chính:**
1. Truy cập trang hồ sơ → hiển thị thông tin hiện tại (email mờ/khóa)
2. Tải ảnh mới → kiểm tra định dạng/dung lượng, hiển thị preview (E3)
3. Chỉnh sửa họ tên, SĐT → kiểm tra real-time
4. Nhấn "Lưu" → kiểm tra toàn bộ (E1, E2)
5. Đẩy ảnh lên cloud (nếu thay đổi) → cập nhật DB
6. Thông báo thành công; màn hình phản ánh thông tin mới ngay lập tức

**Business Rules:**
- BR1: Họ tên bắt buộc, ≤ 50 ký tự, không ký tự đặc biệt
- BR2: SĐT chuẩn Việt Nam
- BR3: Ảnh đại diện: JPG/PNG, ≤ 2MB
- BR4: Email chỉ xem, không được thay đổi

**Ghi chú:** Nên nén ảnh phía client trước khi upload để tối ưu dung lượng cloud miễn phí.

---

### UC03.2 – Đổi mật khẩu

**Actor:** Người dùng | **Priority:** Trung bình

**Mô tả:** Xác minh mật khẩu hiện tại → đặt mật khẩu mới. Nhập sai > 5 lần → tự động đăng xuất + khóa tài khoản 15 phút. Sau đổi thành công → thu hồi phiên thiết bị khác.

**Kết quả sau:**
- Mật khẩu mới cập nhật vào DB
- Refresh token của các phiên khác bị vô hiệu hóa

**Business Rules:**
- BR1: Bắt buộc nhập chính xác mật khẩu hiện tại
- BR2: Mật khẩu mới 8–30 ký tự, có hoa/thường/số/ký tự đặc biệt
- BR3: Mật khẩu mới ≠ mật khẩu hiện tại
- BR4: Nhập sai mật khẩu hiện tại 5 lần → thu hồi token + khóa 15 phút

---

### UC03.3 – Quản lý địa chỉ thường dùng

**Actor:** Khách hàng | **Priority:** Trung bình

**Mô tả:** Quản lý tối đa 5 địa chỉ. Hệ thống kết hợp tự động lấy tọa độ qua API địa chính + bản đồ tương tác để người dùng tinh chỉnh ghim thủ công. Tọa độ này hỗ trợ AI gợi ý dịch vụ gần nhà.

**Các luồng:**
- **1.0 Thêm mới:** Chọn Tỉnh/Huyện/Xã/Chi tiết → hệ thống tự động lấy tọa độ + di chuyển ghim bản đồ → người dùng kéo thả ghim tinh chỉnh → lưu (địa chỉ văn bản + tọa độ ghim cuối cùng)
- **1.1 Cập nhật:** Mở form với dữ liệu + vị trí ghim hiện tại → chỉnh sửa → lưu
- **1.2 Xóa:** Xác nhận xóa; cảnh báo đặc biệt nếu là địa chỉ mặc định (E3)
- **1.3 Đặt mặc định:** Cập nhật trạng thái mặc định, gỡ trạng thái cũ

**Business Rules:**
- BR1: Tối đa 5 địa chỉ/khách hàng
- BR2: Chỉ một địa chỉ mặc định tại một thời điểm
- BR3: Ưu tiên tọa độ ghim thủ công hơn tọa độ API tự động
- BR4: Địa chỉ mặc định tự động điền vào form tạo booking mới
- BR5: Chỉ tài khoản Khách hàng mới truy cập được chức năng này

---

