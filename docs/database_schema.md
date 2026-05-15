# CƠ SỞ DỮ LIỆU HỆ THỐNG (DATABASE SCHEMA)

### Bảng 3.64. Bảng users - Thông tin tài khoản cốt lõi
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| email | VARCHAR(100) | Địa chỉ email (duy nhất, dùng để đăng nhập) |
| password | VARCHAR(255) | Mật khẩu đã mã hóa |
| full_name | VARCHAR(100) | Họ và tên người dùng |
| phone | VARCHAR(15) | Số điện thoại liên lạc |
| avatar_url | VARCHAR(255) | Link ảnh đại diện |
| role | ENUM | Vai trò: ADMIN / STAFF / PROVIDER / CUSTOMER |
| status | ENUM | Trạng thái: ACTIVE / LOCKED / PENDING |
| email_verified | BOOLEAN | Trạng thái đã xác thực email (mặc định False) |
| created_at | DATETIME | Thời điểm tạo tài khoản |
| updated_at | DATETIME | Thời điểm cập nhật thông tin gần nhất |

### Bảng 3.65. Bảng otp_attempts - Kiểm soát gửi và xác thực mã OTP
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| email | VARCHAR(100) | Email nhận mã |
| type | ENUM | Loại: REGISTER / RESET_PASSWORD |
| code | VARCHAR(6) | Mã OTP 6 chữ số |
| last_sent_at | DATETIME | Thời điểm gửi gần nhất (kiểm tra cooldown 60s) |
| wrong_attempts | INT | Số lần nhập sai liên tiếp (giới hạn 5 lần) |
| ip_address | VARCHAR(50) | Địa chỉ IP để chống spam |
| expires_at | DATETIME | Thời điểm mã hết hạn (10 phút) |

### Bảng 3.66. Bảng refresh_tokens - Quản lý phiên làm việc
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| user_id | INT (FK → users.id) | Người sở hữu phiên |
| token | TEXT | Mã refresh token lưu tại Http-only cookie |
| expires_at | DATETIME | Thời điểm hết hạn token |
| revoked | BOOLEAN | Đã thu hồi (khi đăng xuất hoặc đổi mật khẩu) |

### Bảng 3.67. Bảng password_resets - Yêu cầu đặt lại mật khẩu
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| user_id | INT (FK → users.id) | Người yêu cầu đặt lại |
| token | VARCHAR(255) | Mã liên kết đặt lại mật khẩu (dùng 1 lần) |
| expires_at | DATETIME | Thời điểm hết hạn liên kết (15 phút) |
| used | BOOLEAN | Trạng thái đã sử dụng |

### Bảng 3.68. Bảng kyc_profiles - Hồ sơ xác minh nhà cung cấp
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| provider_id | INT (FK → users.id) | Nhà cung cấp nộp hồ sơ |
| cccd_front_url | VARCHAR(255) | Ảnh CCCD mặt trước |
| cccd_back_url | VARCHAR(255) | Ảnh CCCD mặt sau |
| portrait_url | VARCHAR(255) | Ảnh chân dung |
| certificate_url | VARCHAR(255) | Ảnh chứng chỉ hành nghề (tùy chọn) |
| status | ENUM | Trạng thái: PENDING / APPROVED / REJECTED |
| reviewed_by | INT (FK → users.id) | Admin/Staff thực hiện duyệt |
| reject_reason | TEXT | Lý do từ chối (bắt buộc nếu REJECTED) |
| created_at | DATETIME | Thời điểm nộp hồ sơ |
| updated_at | DATETIME | Thời điểm cập nhật cuối cùng |

### Bảng 3.69. Bảng user_addresses - Địa chỉ thường dùng và Tọa độ
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| user_id | INT (FK → users.id) | Người sở hữu địa chỉ |
| label | VARCHAR(50) | Tên gợi nhớ (vd: Nhà riêng) |
| province | VARCHAR(50) | Tỉnh/Thành phố |
| district | VARCHAR(50) | Quận/Huyện |
| ward | VARCHAR(50) | Phường/Xã |
| address_detail | TEXT | Số nhà, tên đường (khớp form đặc tả) |
| latitude | DECIMAL(10,8) | Vĩ độ phục vụ AI tìm kiếm bán kính 5km |
| longitude | DECIMAL(11,8) | Kinh độ phục vụ AI tìm kiếm bán kính 5km |
| is_default | BOOLEAN | Địa chỉ ưu tiên dùng cho booking mới |

### Bảng 3.70. Bảng service_categories - Danh mục dịch vụ
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| name | VARCHAR(100) | Tên danh mục (duy nhất) |
| description | TEXT | Mô tả chi tiết danh mục |
| parent_id | INT (FK → cat.id) | ID danh mục cha (để trống nếu là cấp gốc) |
| level | INT | Cấp độ (1, 2, 3) để chặn tạo quá 3 cấp |
| is_deleted | BOOLEAN | Trạng thái xóa mềm (Soft delete) |

### Bảng 3.71. Bảng services - Thông tin dịch vụ cung cấp
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| provider_id | INT (FK → users.id) | Nhà cung cấp sở hữu dịch vụ |
| category_id | INT (FK → cat.id) | Thuộc danh mục nào |
| name | VARCHAR(100) | Tên dịch vụ |
| description | TEXT | Mô tả (hỗ trợ Rich Text Editor) |
| reference_price | DECIMAL(15,2) | Giá tham khảo ban đầu |
| status | ENUM | DRAFT / PENDING / ACTIVE / HIDDEN / REJECTED |
| is_sensitive | BOOLEAN | Đánh dấu chứa từ khóa cấm (AI quét tự động) |
| avg_rating | DECIMAL(3,2) | Điểm đánh giá trung bình |
| total_reviews | INT | Tổng số lượt đã đánh giá |
| embedding | VECTOR(768) | Lưu trữ vector ngữ nghĩa cho AI (text-embedding-004, 768 chiều) |
| is_deleted | BOOLEAN | Trạng thái xóa mềm |

### Bảng 3.72. Bảng service_images - Thư viện ảnh dịch vụ
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| service_id | INT (FK → services.id) | Liên kết dịch vụ |
| image_url | VARCHAR(255) | Đường dẫn ảnh |
| cloudinary_id | VARCHAR(255) | ID gốc trên Cloudinary |
| display_order | INT | Thứ tự (0 là ảnh bìa hiển thị mặc định) |

### Bảng 3.73. Bảng bookings - Quản lý đặt lịch
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| booking_code | VARCHAR(20) | Mã booking duy nhất phục vụ đối soát |
| customer_id | INT (FK → users.id) | Khách hàng đặt lịch |
| provider_id | INT (FK → users.id) | Nhà cung cấp tiếp nhận |
| service_id | INT (FK → services.id) | Dịch vụ được đặt |
| description | TEXT | Mô tả vấn đề/nhu cầu của khách |
| province | VARCHAR(50) | Tỉnh/Thành thực hiện |
| district | VARCHAR(50) | Quận/Huyện thực hiện |
| ward | VARCHAR(50) | Phường/Xã thực hiện |
| address_detail | TEXT | Địa chỉ chi tiết nơi thợ đến |
| desired_time | DATETIME | Thời gian mong muốn khảo sát |
| status | ENUM | PENDING / QUOTED / CONFIRMED / IN_PROGRESS / DONE / DISPUTED / CANCELLED |
| surveyor_name | VARCHAR(100) | Tên người đến nhà khảo sát |
| surveyor_phone | VARCHAR(15) | SĐT người khảo sát |
| completed_at | DATETIME | NCC bấm Hoàn thành (bắt đầu 24h chờ) |
| auto_completed_at | DATETIME | Thời điểm hệ thống tự duyệt (completed_at + 24h) |

### Bảng 3.74. Bảng quotations - Báo giá chính thức
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| booking_id | INT (FK → bookings.id) | Liên kết đơn hàng |
| actual_price | DECIMAL(15,2) | Giá thực tế sau khi khảo sát |
| commission_rate_snapshot | DECIMAL(5,2) | Chốt tỉ lệ hoa hồng sàn lúc gửi báo giá |
| estimated_time | VARCHAR(100) | Thời gian dự kiến hoàn thành |
| note | TEXT | Ghi chú hạng mục thi công |

### Bảng 3.75. Bảng booking_attachments - Bằng chứng thực hiện
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| booking_id | INT (FK → bookings.id) | Liên kết đơn hàng |
| type | ENUM | SURVEY (biên bản) / RESULT (kết quả xong) |
| file_url | VARCHAR(255) | Đường dẫn ảnh/tài liệu minh chứng |

### Bảng 3.76. Bảng booking_status_histories - Timeline trạng thái
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| booking_id | INT (FK → bookings.id) | Liên kết đơn hàng |
| from_status | VARCHAR(50) | Trạng thái trước khi đổi |
| to_status | VARCHAR(50) | Trạng thái sau khi đổi |
| changed_by | INT (FK → users.id) | Người thực hiện thao tác |
| note | TEXT | Lý do (bắt buộc khi hủy/ẩn đơn) |
| created_at | DATETIME | Thời điểm ghi nhận sự kiện |

### Bảng 3.77. Bảng provider_wallets - Ví nội bộ nhà cung cấp
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| provider_id | INT (FK → users.id) | Chủ sở hữu ví |
| balance | DECIMAL(15,2) | Số dư thực tế trong ví |
| is_restricted | BOOLEAN | Bị chặn nhận đơn mới khi số dư âm |
| updated_at | DATETIME | Lần cuối cập nhật số dư |

### Bảng 3.78. Bảng wallet_transactions - Lịch sử dòng tiền
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| wallet_id | INT (FK → wallets.id) | Ví bị tác động |
| type | ENUM | DEPOSIT (nạp) / COMMISSION (trừ phí sàn) / PENALTY (phạt tranh chấp) |
| amount | DECIMAL(15,2) | Số tiền biến động (vd: -20,000) |
| booking_id | INT (FK, NULLABLE) | Đơn hàng gây ra phí (Null nếu là Nạp tiền) |
| dispute_id | INT (FK, NULLABLE) | Tranh chấp gây ra phạt (chỉ có giá trị khi type = PENALTY) |
| status | ENUM | SUCCESS / FAILED / PENDING |
| vnpay_txn_ref | VARCHAR(100) | Mã tham chiếu VNPay (Chống cộng tiền đúp) |
| created_at | DATETIME | Thời điểm phát sinh giao dịch |

### Bảng 3.79. Bảng commission_configs - Cấu hình phí sàn
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| rate | DECIMAL(5,2) | Tỉ lệ phần trăm hoa hồng thu NCC |
| reason | TEXT | Giải trình lý do thay đổi chính sách |
| configured_by | INT (FK → users.id) | Admin thực hiện thiết lập |
| effective_from | DATETIME | Thời điểm bắt đầu có hiệu lực |

### Bảng 3.80. Bảng reviews - Đánh giá từ khách hàng
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| booking_id | INT (FK → bookings.id) | Chỉ đánh giá khi đơn đã Hoàn thành |
| customer_id | INT (FK) | Người đánh giá |
| service_id | INT (FK) | Dịch vụ bị đánh giá |
| rating | INT | Chấm điểm (1-5 sao) |
| comment | TEXT | Nhận xét chi tiết (tùy chọn) |
| created_at | DATETIME | Thời điểm gửi đánh giá |

### Bảng 3.81. Bảng conversations - Phòng chat liên kết
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| booking_id | INT (FK → bookings.id) | Ngữ cảnh của cuộc trò chuyện |
| customer_id | INT (FK → users.id) | ID khách hàng tham gia |
| provider_id | INT (FK → users.id) | ID nhà cung cấp tham gia |
| updated_at | DATETIME | Thời điểm có tin nhắn mới nhất |

### Bảng 3.82. Bảng messages - Nội dung tin nhắn
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| conversation_id | INT (FK → conv.id) | Thuộc phòng chat nào |
| sender_id | INT | ID người gửi (0 nếu là AI Chatbot) |
| sender_type | ENUM | CUSTOMER / PROVIDER / AI |
| content | TEXT | Nội dung hội thoại (WebSocket) |
| is_read | BOOLEAN | Trạng thái tin nhắn đã được xem chưa |
| created_at | DATETIME | Thời điểm gửi tin nhắn |

### Bảng 3.83. Bảng notifications - Thông báo thời gian thực
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| user_id | INT (FK → users.id) | Người nhận thông báo |
| type | VARCHAR(50) | Loại sự kiện (KYC_RESULT, NEW_BOOKING...) |
| title | VARCHAR(255) | Tiêu đề hiển thị |
| content | TEXT | Nội dung thông báo tóm tắt |
| reference_id | INT | ID đối tượng (Booking_id, KYC_id...) |
| is_read | BOOLEAN | Đã nhấn xem hay chưa |
| created_at | DATETIME | Thời điểm phát sinh sự kiện |

### Bảng 3.84. Bảng audit_logs - Nhật ký hành động quản trị
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| actor_id | INT (FK → users.id) | Người thực hiện hành động |
| action | VARCHAR(100) | Hành động (vd: LOCK_USER, UPDATE_COMMISSION...) |
| target_type | VARCHAR(50) | Loại đối tượng bị tác động (USER/SERVICE/CONFIG) |
| target_id | INT | ID của đối tượng bị tác động |
| description | TEXT | Giải trình chi tiết lý do/hành động |
| ip_address | VARCHAR(50) | Địa chỉ IP thực hiện thao tác |
| created_at | DATETIME | Thời điểm thực hiện hành động |

### Bảng 3.85. Bảng disputes - Đơn khiếu nại
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| Booking_id | INT (FK) | Đơn hàng đang tranh chấp |
| Raised_by | INT (FK) | Người mở khiếu nại |
| assigned_to | INT (FK) | Nhân viên/Admin nhận phân xử |
| reason | TEXT | Lý do khiếu nại |
| status | ENUM | PENDING (Chờ xử lý) / IN_REVIEW (Đang xử lý) / RESOLVED (Đã chốt) |
| resolution_action | ENUM | Hành động |
| resolution_reason | TEXT | Lời giải thích của Admin khi chốt |
| created_at | DATETIME | Lúc mở tranh chấp |

### Bảng 3.86. Bảng dispute_evidences - Bằng chứng tranh chấp
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| dispute_id | INT (FK → disputes.id) | Mã đơn tranh chấp |
| type | ENUM | IMAGE / VIDEO |
| file_url | VARCHAR(255) | Link bằng chứng |
| uploaded_by | INT (FK) | Ai upload |

---

### Bảng 3.87. Bảng provider_stats - Thống kê hiệu suất nhà cung cấp (dùng cho AI Ranking)
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | INT (PK) | Khóa chính |
| provider_id | INT (FK → users.id) | Nhà cung cấp |
| total_bookings | INT | Tổng số đơn từng nhận |
| completed_bookings | INT | Số đơn hoàn thành (status = DONE) |
| cancelled_bookings | INT | Số đơn đã hủy |
| avg_rating | DECIMAL(3,2) | Điểm đánh giá trung bình (từ bảng reviews) |
| completion_rate | DECIMAL(5,4) | Tỉ lệ hoàn thành = completed / total (0.0–1.0) |
| updated_at | DATETIME | Thời điểm cập nhật cuối (trigger sau mỗi booking status change) |

> **Ghi chú:** Bảng này là **materialized cache** — dữ liệu được tính lại sau mỗi sự kiện booking thay đổi trạng thái (BullMQ job). Không dùng để truy vấn realtime; mục đích chính là cung cấp các signal cho AI Ranking pipeline (UC15.3) mà không phải JOIN nhiều bảng mỗi request.

---

### Bảng 3.88. Bảng user_events - Hành vi người dùng (dùng cho AI Personalization)
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính (gen_random_uuid) |
| user_id | INT (FK → users.id, NULLABLE) | Người dùng (NULL nếu chưa đăng nhập) |
| session_id | UUID | Phiên làm việc (dùng để group hành vi anonymous) |
| event_type | VARCHAR(30) | Loại sự kiện: search / view_service / click_result / book_service / ai_query |
| payload | JSONB | Dữ liệu chi tiết tùy event_type (xem UC15.3 Data Source 3) |
| created_at | TIMESTAMPTZ | Thời điểm ghi nhận sự kiện |

> **Ghi chú:** Chỉ dùng để aggregate thống kê hành vi cho personalization. Dữ liệu được retain 90 ngày rồi purge tự động (cronjob hàng ngày). Không chứa thông tin nhạy cảm — chỉ là service_id, query text, và vị trí click.

---

### Bảng 3.89. Bảng user_profiles - Hồ sơ sở thích người dùng (AI Personalization)
| Tên trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| user_id | INT (PK, FK → users.id) | Người dùng |
| preferred_categories | JSONB | Danh sách [{category_id, score}] sắp theo mức độ quan tâm |
| preferred_area | JSONB | {lat, lng, radius_km} suy ra từ lịch sử booking |
| price_sensitivity | VARCHAR(10) | Mức nhạy cảm giá: low / medium / high (từ filter history) |
| booking_count | INT | Tổng số booking đã tạo (dùng để check cold start: < 2 → không personalize) |
| last_active_at | TIMESTAMPTZ | Lần cuối tương tác với hệ thống |
| updated_at | TIMESTAMPTZ | Lần cuối aggregate từ user_events (job chạy mỗi giờ) |

> **Ghi chú:** Được tổng hợp tự động từ `user_events` của 90 ngày gần nhất bởi job định kỳ. Không do người dùng nhập thủ công. Khi `booking_count < 2`, hệ thống bỏ qua bảng này và trả `personalization_score = 0` để tránh kết quả sai lệch (cold start).