import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật - HomeService',
  description: 'Cách HomeService thu thập, sử dụng và bảo vệ thông tin cá nhân của người dùng.',
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl rounded-[20px] bg-white p-5 shadow-[var(--brand-shadow-sm)] sm:p-8">
      <p className="text-sm font-semibold text-action-blue">HomeService</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-midnight-indigo text-balance">
        Chính sách bảo mật
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        HomeService chỉ thu thập thông tin cần thiết để tạo tài khoản, xử lý đặt lịch, kết nối khách hàng với nhà cung cấp và hỗ trợ khi có tranh chấp.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-blue">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Thông tin được sử dụng</h2>
          <p className="mt-2">
            Thông tin liên hệ, địa chỉ dịch vụ, nội dung đặt lịch, lịch sử trao đổi và dữ liệu thanh toán được dùng để vận hành đơn hàng và cải thiện chất lượng dịch vụ.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">Chia sẻ dữ liệu</h2>
          <p className="mt-2">
            Chúng tôi chỉ chia sẻ thông tin đơn hàng cần thiết với nhà cung cấp được chọn. HomeService không bán dữ liệu cá nhân của người dùng cho bên thứ ba.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">Quyền của người dùng</h2>
          <p className="mt-2">
            Người dùng có thể yêu cầu xem, cập nhật hoặc xóa thông tin cá nhân bằng cách liên hệ bộ phận hỗ trợ qua email support@homeservice.vn.
          </p>
        </div>
      </div>
    </section>
  );
}
