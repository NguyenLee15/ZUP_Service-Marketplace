// Lightweight translations manager for easy localization mapping in the Provider app
// This enables drop-in integration with standard dynamic i18n libraries later without hardcoding.

const DICTIONARY: Record<string, string> = {
  // General
  "general.offline": "Đang ngoại tuyến. Một số tính năng sẽ bị tạm khóa.",
  "general.welcome": "Xin chào",
  "general.provider": "Nhà cung cấp",
  "general.support": "Hỗ trợ",
  "general.notification": "Thông báo",
  "general.support_message":
    "Nếu gặp sự cố đăng nhập, vui lòng liên hệ tổng đài 1900-xxxx.",

  // Authentication
  "auth.login": "Đăng nhập",
  "auth.register": "Đăng ký",
  "auth.no_account": "Bạn chưa có tài khoản? ",
  "auth.email_placeholder": "Email/Số điện thoại/Tên đăng nhập",
  "auth.password": "Mật khẩu",
  "auth.forgot_password": "Quên?",
  "auth.biometric_setup": "Bảo mật sinh trắc học",
  "auth.biometric_prompt":
    "Bạn có muốn dùng Vân tay / FaceID để mở khóa phiên đăng nhập cho lần sau không?",
  "auth.biometric_not_enabled": "Chưa kích hoạt",
  "auth.biometric_guide":
    'Vui lòng đăng nhập thủ công bằng email và mật khẩu một lần, sau đó chọn "Bật ngay" khi được hỏi để kích hoạt đăng nhập sinh trắc học.',
  "auth.biometric_off": "Đã tắt tự động đăng nhập sinh trắc học.",
  "auth.biometric_enable_label": "Bật xác thực vân tay / FaceID",
  "auth.provider_only_error": "Ứng dụng này chỉ dành cho Nhà cung cấp dịch vụ",
  "auth.biometric_error":
    "Chưa thể xác thực sinh trắc học. Vui lòng đăng nhập lại.",
  "auth.session_expired": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  "auth.validation_error": "Vui lòng nhập email và mật khẩu",
  "auth.network_error":
    "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.",
  "auth.login_failed": "Email hoặc mật khẩu không đúng",
  "auth.google_login": "Đăng nhập với Google",
  "auth.google_failed":
    "Chưa thể đăng nhập bằng Google. Vui lòng dùng email/mật khẩu hoặc thử lại sau.",
  "auth.google_config_missing":
    "Chưa cấu hình đăng nhập Google cho ứng dụng thợ.",
  "auth.google_token_missing":
    "Không nhận được thông tin xác thực từ Google. Vui lòng thử lại.",
};

export function t(key: string, fallback?: string): string {
  return DICTIONARY[key] || fallback || key;
}
