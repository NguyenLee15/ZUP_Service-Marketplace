import { Search, ShieldCheck, ThumbsUp } from 'lucide-react';

const steps = [
  {
    icon: Search,
    step: 'Bước 01',
    title: 'Tìm dịch vụ phù hợp',
    description: 'Nhập nhu cầu hoặc chọn danh mục để xem danh sách thợ. Bạn có thể xem trước hồ sơ, giá tham khảo và đánh giá thực tế.',
  },
  {
    icon: ShieldCheck,
    step: 'Bước 02',
    title: 'Khảo sát & nhận báo giá',
    description: 'Mô tả tình trạng, chọn địa chỉ và thời gian. Thợ sẽ liên hệ tư vấn, khảo sát thực tế và gửi báo giá minh bạch trước khi làm.',
  },
  {
    icon: ThumbsUp,
    step: 'Bước 03',
    title: 'Nghiệm thu & an tâm',
    description: 'Theo dõi tiến độ trực tiếp trên ứng dụng. Chỉ thanh toán và đánh giá khi công việc đã hoàn thành đúng cam kết.',
  },
];

export function HowItWorks() {
  return (
    <section id="quy-trinh-hoat-dong" className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 py-10 md:py-14">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2">
            Quy trình làm việc
          </span>
          <h2 id="tieu-de-quy-trinh" className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 text-balance">
            Đặt dịch vụ rõ ràng, <span className="text-sky-600 dark:text-sky-400">minh bạch từng bước</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.step}
                className="group relative rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm transition-all duration-150 hover:border-sky-500/40 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                    {step.step}
                  </span>
                </div>

                <h3 className="mb-2 text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  {step.title}
                </h3>
                <p className="text-xs md:text-sm font-normal leading-relaxed text-slate-600 dark:text-slate-400">
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
