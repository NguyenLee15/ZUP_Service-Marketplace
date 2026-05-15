<!-- FILE: 03_UC_ADMIN.md | SCOPE: UC04 Danh mục · UC05 Duyệt dịch vụ · UC06 Users/KYC · UC07 Staff · UC08 Booking · UC09 Tranh chấp · UC10 Báo cáo -->

## UC04 – QUẢN LÝ DANH MỤC DỊCH VỤ {#uc04}

### UC04.1 – Xem và tìm kiếm danh mục

**Actor:** Nhân viên, Quản trị viên | **Priority:** Trung bình

**Mô tả:** Xem danh sách danh mục theo cấu trúc cha–con với trạng thái hoạt động. Tìm kiếm linh hoạt theo tên, có phân trang.

**Business Rules:**
- BR1: Hiển thị cấu trúc cha–con, con thụt lề so với cha
- BR2: Tìm kiếm không phân biệt hoa/thường, khớp chuỗi con
- BR3: Phân trang mặc định 20–50 bản ghi/trang

**Ghi chú:** Đây là điểm vào để thực hiện UC04.2, UC04.3, UC04.4.

---

### UC04.2 – Thêm danh mục mới

**Actor:** Nhân viên, Quản trị viên | **Priority:** Trung bình

**Form:** Tên, Mô tả, Ảnh/Icon (tùy chọn), Trạng thái, Danh mục cha (tùy chọn – nếu để trống → danh mục gốc)

**Business Rules:**
- BR1: Tên bắt buộc, ≤ 100 ký tự, không trùng lặp toàn hệ thống
- BR2: Chỉ một danh mục cha duy nhất
- BR3: Giới hạn độ sâu 3 cấp (Gốc → Cấp 2 → Cấp 3)
- BR4: Mặc định trạng thái "Đang hoạt động" trừ khi chủ động chọn "Bị ẩn"

---

### UC04.3 – Cập nhật danh mục

**Actor:** Nhân viên, Quản trị viên | **Priority:** Trung bình

**Mô tả:** Chỉnh sửa tên, mô tả, trạng thái, ảnh, danh mục cha. Hệ thống ngăn vòng lặp cha–con và đảm bảo giới hạn độ sâu.

**Ngoại lệ quan trọng:**
- **E3 Vòng lặp cha-con:** Không thể chọn danh mục cấp dưới làm cha mới
- **E4 Vượt giới hạn độ sâu:** Nếu thay đổi cha làm nhánh vượt 3 cấp → chặn

---

### UC04.4 – Xóa danh mục

**Actor:** Nhân viên, Quản trị viên | **Priority:** Trung bình

**Mô tả:** Xóa mềm (soft delete) – không xóa vật lý. Danh mục bị ẩn khỏi giao diện và module AI gợi ý.

**Ràng buộc xóa:**
- **E1:** Không thể xóa nếu đang chứa dịch vụ (kể cả dịch vụ đang ẩn)
- **E2:** Không thể xóa nếu đang là cha của danh mục khác

**Business Rules:**
- BR1: Soft delete — set `is_deleted = true` trên bảng `service_categories` (không phải `deletedAt`)
- BR2: Không xóa nếu có dịch vụ trực thuộc
- BR3: Không xóa nếu đang là danh mục cha
- BR4: Sau xóa mềm → loại khỏi truy vấn AI gợi ý

---

## UC05 – DUYỆT VÀ QUẢN LÝ DỊCH VỤ {#uc05}

### UC05.1 – Xem danh sách và chi tiết dịch vụ

**Actor:** Nhân viên, Quản trị viên | **Priority:** Cao

**Hiển thị:** Tên dịch vụ, NCC, danh mục, trạng thái duyệt, ngày tạo/cập nhật.

**Bộ lọc:** Trạng thái (Chờ duyệt / Đang hoạt động / Đã ẩn / Bị từ chối), Danh mục, Khoảng thời gian.

**Ưu tiên hiển thị:** Dịch vụ "Chờ duyệt" lên đầu danh sách.

**Business Rules:**
- BR1: Phân trang server-side bắt buộc
- BR2: SLA duyệt dịch vụ: "Chờ duyệt" > 48h → bôi vàng cảnh báo

**Ghi chú:** Điểm vào cho UC05.2, UC05.3.

---

### UC05.2 – Duyệt / Từ chối dịch vụ

**Actor:** Nhân viên, Quản trị viên | **Priority:** Cao

**Mô tả:** Xem toàn bộ thông tin dịch vụ → phê duyệt hoặc từ chối kèm lý do.

**Phê duyệt:** Trạng thái → "Đang hoạt động" → thông báo NCC.

**Từ chối:** Bắt buộc nhập lý do → trạng thái → "Bị từ chối" → thông báo NCC kèm hướng dẫn sửa đổi.

**Business Rules:**
- BR1: Lý do từ chối bắt buộc
- BR2: Mọi quyết định ghi audit log (actor_id, timestamp, lý do)
- BR3: NCC bị từ chối được phép cập nhật và nộp lại không giới hạn số lần

---

### UC05.3 – Ẩn / Xóa dịch vụ (Admin)

**Actor:** Quản trị viên | **Priority:** Trung bình

**Mô tả:** Soft delete – ẩn hoàn toàn khỏi giao diện và AI, giữ dữ liệu trong DB cho đối soát đơn cũ.

**Business Rules:**
- BR1: Chỉ Admin có quyền xóa; Staff chỉ có quyền ẩn
- BR2: Soft delete để bảo toàn dữ liệu booking lịch sử
- BR3: Loại bỏ ngay khỏi gợi ý AI và chatbot
- BR4: Ghi audit log: ID người xóa, thời gian, lý do

---

## UC06 – QUẢN LÝ TÀI KHOẢN NGƯỜI DÙNG VÀ KYC {#uc06}

### UC06.1 – Xem và tìm kiếm tài khoản

**Actor:** Quản trị viên, Nhân viên | **Priority:** Trung bình

**Mô tả:** Danh sách khách hàng và nhà cung cấp. Bộ lọc: vai trò, trạng thái (hoạt động/bị khóa/chờ duyệt). Tìm kiếm theo email/tên. Trạng thái "Chờ duyệt" được làm nổi bật để Admin nhận diện KYC mới.

**Ghi chú:** Đây là điểm vào cho UC06.2, UC06.3, UC06.4, UC06.5.

---

### UC06.2 – Cập nhật trạng thái tài khoản (Khóa/Mở khóa)

**Actor:** Quản trị viên, Nhân viên | **Priority:** Cao

**Mô tả:** Khóa/mở khóa tài khoản. Lệnh khóa thu hồi phiên ngay lập tức và ẩn dịch vụ liên quan.

**Kết quả sau (khi khóa):**
- Trạng thái cập nhật trong DB
- Toàn bộ phiên đăng nhập bị vô hiệu hóa ngay lập tức
- Các dịch vụ trực thuộc ẩn khỏi AI và tìm kiếm
- Người dùng nhận thông báo kèm lý do

**Business Rules:**
- BR1: Tài khoản bị khóa → mọi request đều bị từ chối
- BR2: Hiệu lực ngay lập tức (real-time session revocation)
- BR3: Lý do bắt buộc, ghi audit log
- BR4: Chỉ Admin mới có quyền mở khóa các tài khoản bị hệ thống tự động khóa

---

### UC06.3 – Xóa tài khoản

**Actor:** Quản trị viên | **Priority:** Thấp

**Mô tả:** Soft delete. Không thể xóa nếu còn booking chưa hoàn thành (đang xử lý, đang thực hiện, đang khiếu nại).

**Business Rules:**
- BR1: Chỉ Admin có quyền xóa; Staff chỉ khóa/mở khóa
- BR2: Soft delete, bảo toàn audit log và lịch sử thanh toán
- BR3: Tài khoản đã xóa → từ chối mọi đăng nhập và cấp token

---

### UC06.4 – Xét duyệt hồ sơ KYC nhà cung cấp

**Actor:** Quản trị viên, Nhân viên | **Priority:** Cao

**Mô tả:** Kiểm tra thủ công ảnh CCCD (2 mặt), ảnh chân dung cầm CCCD, chứng chỉ hành nghề. Có công cụ zoom/xoay ảnh. Ảnh được phục vụ qua pre-signed URL có TTL ≤ 1 giờ (không public URL).

**Luồng phê duyệt:**
1. Chọn hồ sơ trong danh sách chờ duyệt
2. Hệ thống tạo pre-signed URL → hiển thị ảnh để xem, zoom/xoay kiểm tra
3. Nhấn "Phê duyệt" → xác nhận
4. Cập nhật KYC "đã duyệt" → mở khóa chức năng quản lý dịch vụ
5. Gửi thông báo thành công cho NCC

**Luồng từ chối (AF 1.1):** Chọn lý do mẫu hoặc tự nhập → xác nhận → gửi thông báo kèm hướng dẫn sửa đổi.

**Business Rules:**
- BR1: NCC chưa duyệt KYC → bị chặn hoàn toàn quyền tạo/quản lý dịch vụ
- BR2: Mọi quyết định ghi audit log
- BR3: NCC bị từ chối có thể nộp lại không giới hạn số lần

**Ghi chú:** Nên hiển thị lịch sử các lần nộp KYC trước để nhân viên đối soát.

---

## UC07 – QUẢN LÝ TÀI KHOẢN NHÂN VIÊN {#uc07}

### UC07.1 – Xem danh sách tài khoản nhân viên

**Actor:** Quản trị viên | **Priority:** Trung bình

**Hiển thị:** Tên, email, vai trò, trạng thái. Hỗ trợ tìm kiếm và lọc. Tuyệt đối không hiển thị mật khẩu.

**Ghi chú:** Điểm vào cho UC07.2, UC07.3, UC07.4.

---

### UC07.2 – Thêm tài khoản nhân viên

**Actor:** Quản trị viên | **Priority:** Trung bình

**Mô tả:** Admin khởi tạo tài khoản cho nhân sự mới. Hệ thống tự động sinh mật khẩu ngẫu nhiên và gửi email chào mừng kèm thông tin đăng nhập.

**Form:** Họ tên (bắt buộc), Email (bắt buộc, duy nhất toàn hệ thống), SĐT (tùy chọn), Vai trò (Admin/Staff, bắt buộc).

**Business Rules:**
- BR2: Email duy nhất toàn hệ thống (không trùng với bất kỳ loại tài khoản nào)
- BR3: Tài khoản mới → trạng thái "Đang hoạt động"

**Ghi chú:** Nhân viên mới bắt buộc đổi mật khẩu ở lần đăng nhập đầu tiên.

---

### UC07.3 – Cập nhật thông tin và phân quyền

**Actor:** Quản trị viên | **Priority:** Trung bình

**Mô tả:** Chỉnh sửa thông tin hoặc thay đổi vai trò (Admin ↔ Staff). Hạ quyền → thu hồi phiên ngay lập tức.

**Business Rules:**
- BR2: Admin không thể tự hạ quyền chính mình
- BR3: Tăng quyền → hiệu lực lần đăng nhập tiếp theo; hạ quyền → hiệu lực ngay lập tức (buộc đăng xuất)
- BR4: Mọi thay đổi vai trò ghi audit log

---

### UC07.4 – Xóa tài khoản nhân viên

**Actor:** Quản trị viên | **Priority:** Thấp

**Mô tả:** Soft delete. Thu hồi toàn bộ phiên ngay lập tức.

**Ràng buộc (E2):** Không thể xóa Admin duy nhất còn hoạt động trong hệ thống.

---

## UC08 – QUẢN LÝ BOOKING TOÀN HỆ THỐNG {#uc08}

### UC08.1 – Xem và tìm kiếm booking

**Actor:** Quản trị viên, Nhân viên | **Priority:** Trung bình

**Bảng hiển thị:** Mã booking, tên dịch vụ, khách hàng, nhà cung cấp, tổng tiền, trạng thái, ngày tạo.

**Bộ lọc:** Trạng thái (đang khiếu nại, đã hoàn thành...), khoảng thời gian.

**Tìm kiếm:** Mã booking (exact match), tên khách hàng, tên NCC.

**Business Rules:**
- BR1: Server-side pagination bắt buộc
- BR2: Admin/Staff chỉ xem, không được can thiệp trạng thái booking thông thường
- BR3: Tìm theo mã booking phải exact match

**Ghi chú:** Điểm vào cho UC08.2.

---

### UC08.2 – Xem chi tiết và lịch sử trạng thái booking

**Actor:** Quản trị viên, Nhân viên | **Priority:** Trung bình

**Mô tả:** Xem toàn bộ vòng đời của một booking: thông tin chung, chi tiết dịch vụ, địa chỉ, thanh toán, timeline trạng thái (tên trạng thái + thời gian + actor thực hiện).

**Luồng trạng thái đầy đủ:**
```
PENDING → QUOTED → CONFIRMED → IN_PROGRESS → DONE
                                            ↘ CANCELLED
                                            ↘ DISPUTED
                                               (booking giữ DISPUTED sau phán quyết;
                                                resolution_action = COMPLETE | PENALIZE
                                                lưu trong bảng disputes)
```

**Business Rules:**
- BR1: Timeline trạng thái hiển thị: tên trạng thái, thời gian, actor_id + vai trò của người thực hiện
- BR2: Admin/Staff chỉ được xem (read-only), trừ khi booking chuyển sang trạng thái tranh chấp

**Ghi chú:** Dữ liệu này là nền tảng để nhân viên xử lý tranh chấp tại UC09.

---

## UC09 – XỬ LÝ KHIẾU NẠI VÀ TRANH CHẤP {#uc09}

### UC09.1 – Xem danh sách và chi tiết tranh chấp

**Actor:** Quản trị viên, Nhân viên | **Priority:** Cao

**Mô tả:** Danh sách giao dịch đang "Tranh chấp". Ưu tiên "Chờ xử lý" và quá hạn lên đầu. Nhân viên "Nhận phân xử" để khóa tranh chấp cho riêng mình (ngăn làm trùng).

**Bảng hiển thị:** Mã giao dịch, khách hàng, NCC, người phụ trách hiện tại, thời gian tạo tranh chấp.

**Luồng quan trọng:**
- **1.2 Nhận xử lý:** Nhấn "Nhận phân xử" → `UPDATE disputes SET assigned_to = ? WHERE id = ? AND assigned_to IS NULL` → kiểm tra rowsAffected = 1. Nếu 0 → báo lỗi "Tranh chấp đã được nhân viên khác nhận" (xem FS02, NF12)
- **1.3 Xem chi tiết:** Thông tin giao dịch + lý do phản đối + hình ảnh bằng chứng + lịch sử chat (UC18) + lịch sử trạng thái.

**SLA:** Tranh chấp "Chờ xử lý" > 24h → bôi đỏ cảnh báo.

**Business Rules:**
- BR1: Tranh chấp chờ xử lý > 24h → đánh dấu cảnh báo
- BR2: Một tranh chấp chỉ có một người phụ trách tại một thời điểm (enforced bằng DB constraint)
- BR3: Admin cấp cao có quyền gỡ phụ trách / phân công lại

**Ghi chú:** Điểm vào cho UC09.2.

---

### UC09.2 – Phân xử tranh chấp

**Actor:** Quản trị viên, Nhân viên | **Priority:** Cao

**Mô tả:** Xem bằng chứng hai phía → đưa ra phán quyết → 5 phút chờ (có thể hoàn tác) → chính thức thực thi.

**Phán quyết (`disputes.resolution_action`):**
- **COMPLETE** (ủng hộ NCC): Xác nhận công việc hoàn thành — trừ phí hoa hồng từ ví NCC trong `prisma.$transaction()` nguyên tử
- **PENALIZE** (ủng hộ KH): NCC vi phạm — trừ khoản phạt từ ví NCC (Admin nhập số tiền) hoặc khóa tài khoản NCC vĩnh viễn nếu vi phạm nghiêm trọng. Nền tảng không hoàn tiền cho KH (vì không giữ tiền KH — mô hình thanh toán trực tiếp)

**Luồng chính:**
1. Mở chi tiết tranh chấp
2. Xem bằng chứng (thông tin, lý do phản đối, hình ảnh, lịch sử chat)
3. Chọn phán quyết + nhập lý do bắt buộc (E1)
4. Hệ thống persist phán quyết vào DB với `status = pending_execution`, `execute_at = NOW() + 5 phút`
5. Hiển thị đồng hồ đếm ngược 5 phút trên UI
6. Hết 5 phút (server-side timer) → cập nhật trạng thái, xử lý tài chính trong 1 transaction, ghi audit log
7. Gửi thông báo kết quả cho cả hai bên

**Luồng hoàn tác (AF 1.1):** Trong 5 phút → nhấn "Thu hồi phán quyết" → xác nhận → set `status = cancelled` → trả về trạng thái "Tranh chấp chưa phân xử".

**Failure scenario:** Xem FS01 (server crash trong countdown).

**Business Rules:**
- BR1: Lý do phân xử bắt buộc
- BR2: Phán quyết sau 5 phút là quyết định cuối cùng, không thay đổi
- BR3: Xử lý tài chính (trừ hoa hồng hoặc trừ tiền phạt NCC) trong `prisma.$transaction()` nguyên tử, ghi `disputes.resolution_action = COMPLETE | PENALIZE`; booking giữ nguyên `status = DISPUTED`
- BR4: Toàn bộ quá trình (kể cả hoàn tác) ghi audit log

**Ghi chú kỹ thuật:** Bộ đếm ngược phải chạy server-side (persist `execute_at` vào DB) để chống gian lận và đảm bảo recovery khi server restart (FS01).

---

## UC10 – BÁO CÁO, THỐNG KÊ VÀ CẤU HÌNH {#uc10}

### UC10.1 – Thống kê doanh thu hoa hồng

**Actor:** Quản trị viên, Nhân viên | **Priority:** Trung bình

**Hiển thị:**
- **KPI Cards:** Tổng doanh thu, tổng số giao dịch thành công
- **Line Chart:** Biến động doanh thu theo ngày trong tháng
- **Bảng chi tiết:** Mã giao dịch, ngày hoàn thành, tổng tiền, tiền hoa hồng

**Bộ lọc thời gian:** Hôm nay / Tuần này / Tháng này / Năm nay / Tùy chỉnh (từ ngày – đến ngày)

**Business Rules:**
- BR1: Chỉ tính từ giao dịch trạng thái "Hoàn thành (DONE)"
- BR2: Hoa hồng lấy từ `quotations.commission_rate_snapshot` — không tính lại theo tỉ lệ `commission_configs` hiện tại

**Ghi chú:** Bảng dữ liệu chi tiết là nguồn đầu vào cho UC10.4 (xuất báo cáo).

---

### UC10.2 – Thống kê booking, dịch vụ phổ biến và tài khoản mới

**Actor:** Quản trị viên, Nhân viên | **Priority:** Trung bình

**Hiển thị:**
- **Pie Chart:** Tỉ lệ % số lượng booking theo từng trạng thái
- **Top 10 List:** Dịch vụ được đặt nhiều nhất
- **Line/Bar Chart:** Tài khoản mới đăng ký theo ngày (phân tách Khách hàng vs NCC)

**Business Rules:**
- BR1: Xếp hạng dịch vụ phổ biến: ưu tiên 1 là số booking Hoàn thành; ưu tiên 2 là tổng doanh thu
- BR2: Đếm "Tài khoản mới" dựa trên ngày kích hoạt thành công (KH: xác thực email; NCC: duyệt KYC). Không đếm tài khoản chưa kích hoạt.

---

### UC10.3 – Cấu hình tỉ lệ hoa hồng hệ thống

**Actor:** Quản trị viên (chỉ Admin) | **Priority:** Thấp

**Mô tả:** Cập nhật tỉ lệ hoa hồng. Tỉ lệ mới chỉ áp dụng cho giao dịch **tạo mới sau** thời điểm cập nhật. Ghi vết lý do + gửi email thông báo hàng loạt đến toàn bộ NCC.

**Form:** Tỉ lệ hoa hồng mới (%), Lý do thay đổi (bắt buộc). Cả hai phải hợp lệ trước khi lưu.

**Hộp thoại cảnh báo trước khi lưu:** "Tỉ lệ mới [X%] sẽ áp dụng cho giao dịch mới kể từ thời điểm này. Hệ thống sẽ gửi email đến toàn bộ NCC. Bạn có chắc không?"

**Business Rules:**
- BR1: Tỉ lệ là số thực 0–100%, tối đa 2 chữ số thập phân
- BR2: Không áp dụng hồi tố cho giao dịch đã tạo (snapshot được chốt tại UC12.3)
- BR3: Staff không có quyền truy cập chức năng này
- BR4: Lưu lịch sử toàn bộ thay đổi tỉ lệ hoa hồng (ngày đổi, tỉ lệ cũ → mới, người thực hiện, lý do) để đối soát
- BR5: Tỉ lệ này chỉ áp dụng cho `wallet_transactions.type = COMMISSION`. Khoản phạt tranh chấp (`type = PENALTY`) do Admin nhập tùy theo từng case — không bị ràng buộc bởi tỉ lệ này

**Giao diện đề xuất:** Hiển thị lịch sử cập nhật hoa hồng bên dưới form.

---

### UC10.4 – Xuất báo cáo Excel và PDF

**Actor:** Quản trị viên, Nhân viên | **Priority:** Thấp

**Mô tả:** Xuất dữ liệu đang hiển thị trên màn hình thống kê (UC10.1, UC10.2) ra file .xlsx hoặc .pdf.

**Business Rules:**
- BR1: PDF: khổ A4, có Header (tiêu đề, ngày xuất, khoảng thời gian)
- BR2: Excel: bảng phẳng (Raw data), không gộp ô (Merge cells)
- BR3: Nút "Xuất báo cáo" bị disabled nếu màn hình không có dữ liệu

**Quy tắc đặt tên file:** `BaoCao_[LoaiBaoCao]_[NgayXuat].[DinhDang]`

---

