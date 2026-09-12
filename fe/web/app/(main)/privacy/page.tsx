import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật - ZUP',
  description: 'Cách ZUP thu thập, sử dụng và bảo vệ thông tin cá nhân của người dùng.',
};

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs sm:p-8">
      <p className="text-sm font-semibold text-sky-600 dark:text-sky-400">ZUP</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-slate-900 dark:text-slate-100 text-balance">
        Chính sách bảo mật
      </h1>
      <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
        ZUP chỉ thu thập thông tin cần thiết để tạo tài khoản, xử lý đặt lịch, kết nối khách hàng với nhà cung cấp và hỗ trợ khi có tranh chấp.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Thông tin được sử dụng</h2>
          <p className="mt-2">
            Thông tin liên hệ, địa chỉ dịch vụ, nội dung đặt lịch, lịch sử trao đổi và dữ liệu thanh toán được dùng để vận hành đơn hàng và cải thiện chất lượng dịch vụ.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Chia sẻ dữ liệu</h2>
          <p className="mt-2">
            Chúng tôi chỉ chia sẻ thông tin đơn hàng cần thiết với nhà cung cấp được chọn. ZUP không bán dữ liệu cá nhân của người dùng cho bên thứ ba.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">Quyền của người dùng</h2>
          <p className="mt-2">
            Người dùng có thể yêu cầu xem, cập nhật hoặc xóa thông tin cá nhân bằng cách liên hệ bộ phận hỗ trợ qua email support@zup.vn.
          </p>
        </div>
      </div>
    </section>
  );
}
