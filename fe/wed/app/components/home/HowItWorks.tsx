'use client';

import { Search, ShieldCheck, ThumbsUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Tìm kiếm nhanh',
    description: 'Nhập nhu cầu, khu vực và xem ngay danh sách thợ phù hợp để so sánh.',
  },
  {
    icon: ShieldCheck,
    number: '02',
    title: 'Thợ xác thực',
    description: 'Mọi đối tác đều được kiểm duyệt về hồ sơ, tay nghề và thái độ phục vụ.',
  },
  {
    icon: ThumbsUp,
    number: '03',
    title: 'Đặt lịch rõ ràng',
    description: 'Theo dõi trạng thái đơn, trao đổi với thợ và chỉ xác nhận khi dịch vụ hoàn tất.',
  },
];

export function HowItWorks() {
  return (
    <section className="relative overflow-hidden surface-warm rounded-[1.5rem] md:rounded-[2rem] py-8 md:py-16">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(#2563eb_1px,transparent_1px)] bg-[length:40px_40px] opacity-[0.03]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-14">
          <Badge className="mb-3 md:mb-5 bg-action-blue text-white border-none px-3 md:px-4 py-1.5 md:py-2 rounded-full font-bold tracking-wide text-[10px] md:text-xs shadow-sm">
            Quy trình 3 bước
          </Badge>
          <h2 className="text-2xl md:text-[50px] font-bold brand-heading mb-2 md:mb-4 leading-tight text-balance">
            Dịch vụ chuyên nghiệp <br className="hidden md:block" />
            <span className="text-action-blue">chỉ trong vài bước</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-3 md:gap-5 lg:gap-6">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="relative group p-4 md:p-7 rounded-[16px] md:rounded-[20px] bg-white/85 border border-white/80 hover:bg-white hover:shadow-[var(--brand-shadow-card)] hover:border-action-blue/20 transition-[background-color,border-color,box-shadow] duration-300"
              >
                <div className="flex sm:block items-start gap-4 sm:gap-0">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-action-blue rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 mb-0 sm:mb-7 shadow-[var(--brand-shadow-button)] group-hover:-translate-y-1 transition-transform duration-300">
                    <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5 sm:pt-0">
                    <h3 className="text-base sm:text-xl md:text-2xl font-bold text-midnight-indigo mb-1 sm:mb-3 relative z-10 tracking-tight">{step.title}</h3>
                    <p className="text-slate-blue text-xs sm:text-base font-medium leading-relaxed relative z-10">
                      {step.description}
                    </p>
                  </div>
                </div>
                <span className="absolute top-4 right-4 md:top-6 md:right-6 text-3xl md:text-6xl font-bold text-pale-gray group-hover:text-platinum-tint transition-colors pointer-events-none">
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
