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
    <section className="relative overflow-hidden surface-warm rounded-[2rem] py-14 md:py-16">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(#2563eb_1px,transparent_1px)] bg-[length:40px_40px] opacity-[0.03]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <Badge className="mb-5 bg-action-blue text-white border-none px-4 py-2 rounded-full font-bold tracking-wide text-xs shadow-sm">
            Quy trình 3 bước
          </Badge>
          <h2 className="text-3xl md:text-[50px] font-bold brand-heading mb-4 leading-tight text-balance">
            Dịch vụ chuyên nghiệp <br />
            <span className="text-action-blue">chỉ trong vài bước</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="relative group p-6 md:p-7 rounded-[20px] bg-white/85 border border-white/80 hover:bg-white hover:shadow-[var(--brand-shadow-card)] hover:border-action-blue/20 transition-[background-color,border-color,box-shadow] duration-300"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 bg-action-blue rounded-2xl flex items-center justify-center mb-7 shadow-[var(--brand-shadow-button)] group-hover:-translate-y-1 transition-transform duration-300">
                  <Icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <span className="absolute top-6 right-6 text-5xl md:text-6xl font-bold text-pale-gray group-hover:text-platinum-tint transition-colors pointer-events-none">
                  {step.number}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-midnight-indigo mb-3 relative z-10 tracking-tight">{step.title}</h3>
                <p className="text-slate-blue text-base font-medium leading-relaxed relative z-10">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
