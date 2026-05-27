// Lightweight translations manager for easy localization mapping in the Provider app
// This enables drop-in integration with standard dynamic i18n libraries later without hardcoding.

const DICTIONARY: Record<string, string> = {
  // General
  'general.offline': 'Đang ngoại tuyến. Một số tính năng sẽ bị tạm khóa.',
  'general.welcome': 'Xin chào',
  'general.provider': 'Nhà cung cấp',
  'general.support': 'Hỗ trợ',
  'general.notification': 'Thông báo',
  'general.support_message': 'Nếu gặp sự cố đăng nhập, vui lòng liên hệ tổng đài 1900-xxxx.',

  // Authentication
  'auth.login': 'Đăng nhập',
  'auth.register': 'Đăng ký',
  'auth.no_account': 'Bạn chưa có tài khoản? ',
  'auth.email_placeholder': 'Email/Số điện thoại/Tên đăng nhập',
  'auth.password': 'Mật khẩu',
  'auth.forgot_password': 'Quên?',
  'auth.sms_login': 'Đăng nhập bằng SMS',
  'auth.sms_config': 'Đăng nhập bằng mã SMS OTP đang được cấu hình.',
  'auth.google_login': 'Đăng nhập với Google',
  'auth.facebook_login': 'Đăng nhập với Facebook',
  'auth.biometric_setup': 'Bảo mật sinh trắc học',
  'auth.biometric_prompt': 'Bạn có muốn bật đăng nhập bằng Vân tay / FaceID cho lần sau không?',
  'auth.biometric_not_enabled': 'Chưa kích hoạt',
  'auth.biometric_guide': 'Vui lòng đăng nhập thủ công bằng email và mật khẩu một lần, sau đó chọn "Bật ngay" khi được hỏi để kích hoạt đăng nhập sinh trắc học.',
  'auth.biometric_off': 'Đã tắt tự động đăng nhập sinh trắc học.',
  'auth.biometric_enable_label': 'Bật xác thực vân tay / FaceID',
  'auth.provider_only_error': 'Ứng dụng này chỉ dành cho Nhà cung cấp dịch vụ',
  'auth.biometric_error': 'Xác thực sinh trắc học không thành công hoặc bị hủy.',
  'auth.validation_error': 'Vui lòng nhập email và mật khẩu',
  'auth.network_error': 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.',
  'auth.login_failed': 'Email hoặc mật khẩu không đúng',
};

export function t(key: string, fallback?: string): string {
  return DICTIONARY[key] || fallback || key;
}
