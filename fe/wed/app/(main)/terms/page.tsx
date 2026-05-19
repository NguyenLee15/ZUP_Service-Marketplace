import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng - HomeService',
  description: 'Điều khoản dành cho khách hàng và nhà cung cấp khi sử dụng nền tảng HomeService.',
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl rounded-[20px] bg-white p-5 shadow-[var(--brand-shadow-sm)] sm:p-8">
      <p className="text-sm font-semibold text-action-blue">HomeService</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-midnight-indigo text-balance">
        Điều khoản sử dụng
      </h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        Khi sử dụng HomeService, người dùng đồng ý cung cấp thông tin chính xác, đặt lịch thiện chí và tuân thủ quy trình xác nhận dịch vụ trên nền tảng.
      </p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-blue">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Trách nhiệm của khách hàng</h2>
          <p className="mt-2">
            Khách hàng cần mô tả đúng nhu cầu, cung cấp địa chỉ rõ ràng và phản hồi kịp thời khi nhà cung cấp xác nhận lịch hoặc báo giá.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">Trách nhiệm của nhà cung cấp</h2>
          <p className="mt-2">
            Nhà cung cấp cần cập nhật hồ sơ trung thực, báo giá minh bạch, thực hiện dịch vụ đúng phạm vi đã thỏa thuận và xử lý khiếu nại theo quy định.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-foreground">Hủy lịch và tranh chấp</h2>
          <p className="mt-2">
            Các yêu cầu hủy lịch, hoàn tiền hoặc tranh chấp sẽ được xử lý dựa trên trạng thái đơn hàng, bằng chứng trao đổi và chính sách hỗ trợ hiện hành.
          </p>
        </div>
      </div>
    </section>
  );
}
