// Lightweight translations manager for easy localization mapping
// This enables drop-in integration with standard dynamic i18n libraries later without hardcoding.

const DICTIONARY: Record<string, string> = {
  // General
  'general.offline': 'Mất kết nối mạng. Một số tính năng sẽ bị tạm khóa.',
  'general.offline_restore': 'Đang ngoại tuyến. Dữ liệu gần nhất vẫn được giữ lại nếu có.',
  'general.welcome': 'Xin chào',
  'general.customer': 'khách hàng',
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
  'auth.google_login': 'Đăng nhập với Google',
  'auth.google_error': 'Chưa thể đăng nhập bằng Google. Vui lòng thử lại hoặc dùng email và mật khẩu.',
  'auth.provider_error': 'Tài khoản nhà cung cấp vui lòng dùng app Provider.',
  'auth.session_expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'auth.validation_error': 'Vui lòng nhập email và mật khẩu',
  'auth.email_invalid': 'Email không đúng định dạng',
  'auth.network_error': 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.',

  // Home Screen
  'home.need_help': 'Cần hỗ trợ việc nhà?',
  'home.need_help_sub': 'Tìm dịch vụ phù hợp, đặt lịch, chat và theo dõi đơn ngay trên điện thoại.',
  'home.find_service': 'Tìm dịch vụ',
  'home.ai_advice': 'AI tư vấn',
  'home.featured': 'Dịch vụ nổi bật',
  'home.featured_sub': 'Được chọn lọc cho khách hàng',
  'home.no_featured': 'Chưa có dịch vụ nổi bật. Hãy tìm kiếm theo nhu cầu của bạn.',
  'home.popular': 'Gợi ý phổ biến',
  'home.popular_sub': 'Các dịch vụ được đánh giá tốt',
  'home.empty_home': 'Chưa có dịch vụ gợi ý',
  'home.empty_home_sub': 'Bạn có thể tìm kiếm theo nhu cầu hoặc hỏi AI để được tư vấn nhanh.',
  'home.category': 'Danh mục',
  'home.category_sub': 'Chọn nhanh nhu cầu của bạn',
};

export function t(key: string, fallback?: string): string {
  return DICTIONARY[key] || fallback || key;
}
