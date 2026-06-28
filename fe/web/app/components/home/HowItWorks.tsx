import { Search, ShieldCheck, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Tìm dịch vụ',
    description: 'Nhập nhu cầu hoặc chọn danh mục để xem các dịch vụ phù hợp. Bạn có thể so sánh thông tin, giá tham khảo và đánh giá trước khi đặt.',
  },
  {
    icon: ShieldCheck,
    number: '02',
    title: 'Trao đổi và nhận báo giá',
    description: 'Mô tả yêu cầu, chọn thời gian và địa chỉ. Nhà cung cấp sẽ có thêm thông tin để tư vấn hoặc gửi báo giá trước khi thực hiện.',
  },
  {
    icon: ThumbsUp,
    number: '03',
    title: 'Theo dõi trong một nơi',
    description: 'Lịch hẹn, tin nhắn, trạng thái đơn và đánh giá sau dịch vụ được lưu lại để bạn dễ kiểm tra khi cần hỗ trợ.',
  },
];

export function HowItWorks() {
  return (
    <section id="quy-trinh-hoat-dong" className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#071018] py-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] md:rounded-[2rem] md:py-16">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(rgba(34,211,238,0.28)_1px,transparent_1px)] bg-[length:38px_38px] opacity-[0.12]" />
      <div className="absolute inset-x-0 top-0 z-0 h-40 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.22),transparent_62%)] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-14">
          <Badge className="mb-3 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1.5 text-[10px] font-bold tracking-wide text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.16)] md:mb-5 md:px-4 md:py-2 md:text-xs">
            Quy trình 3 bước
          </Badge>
          <h2 id="tieu-de-quy-trinh" className="mb-2 text-2xl font-bold leading-tight text-slate-100 text-balance md:mb-4 md:text-[50px]">
            Đặt dịch vụ rõ ràng <br className="hidden md:block" />
            <span className="text-cyan-300">chỉ trong vài bước.</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-3 md:gap-5 lg:gap-6">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="group relative rounded-[16px] border border-white/10 bg-[#101827]/88 p-4 shadow-[0_18px_42px_rgba(0,0,0,0.22)] transition-[background-color,border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-[#132033] hover:shadow-[0_22px_52px_rgba(8,145,178,0.14)] md:rounded-[20px] md:p-7"
              >
                <div className="flex sm:block items-start gap-4 sm:gap-0">
                  <div className="mb-0 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B7CFF] shadow-[0_14px_30px_rgba(11,124,255,0.28)] transition-transform duration-300 group-hover:-translate-y-1 md:h-16 md:w-16 md:rounded-2xl sm:mb-7">
                    <Icon className="h-6 w-6 text-white md:h-8 md:w-8" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5 sm:pt-0">
                    <h3 className="relative z-10 mb-1 text-base font-bold tracking-tight text-slate-100 sm:mb-3 sm:text-xl md:text-2xl">{step.title}</h3>
                    <p className="relative z-10 text-xs font-medium leading-relaxed text-slate-400 sm:text-base">
                      {step.description}
                    </p>
                  </div>
                </div>
                <span className="pointer-events-none absolute right-4 top-4 text-3xl font-bold text-slate-700/55 transition-colors group-hover:text-cyan-300/20 md:right-6 md:top-6 md:text-6xl">
                  {step.number}
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
