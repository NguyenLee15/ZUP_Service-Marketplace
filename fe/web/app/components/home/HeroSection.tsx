import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { HeroSearchForm } from './HeroSearchForm';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/70 bg-slate-50 py-8 dark:border-slate-800/70 dark:bg-slate-950 sm:py-12 lg:py-14">
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50 px-3.5 py-1.5 shadow-xs dark:border-sky-800/80 dark:bg-sky-950/50">
            <ShieldCheck className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-sky-800 dark:text-sky-300 sm:text-sm">Nền tảng dịch vụ tiện ích gia đình chuẩn mực ZUP</span>
          </div>
          <h1 className="mt-5 max-w-3xl text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-[3.4rem] text-balance">
            Dịch vụ gia đình chuẩn mực, <br className="hidden sm:block" />
            <span className="text-sky-600 dark:text-sky-400">thợ lành nghề tận tâm.</span>
          </h1>
          <p className="mb-6 mt-5 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base md:text-lg text-balance">
            ZUP giúp bạn kết nối nhanh với thợ sửa chữa, vệ sinh và bảo dưỡng tại nhà. Báo giá minh bạch, khảo sát tận nơi và chỉ nghiệm thu khi hoàn toàn hài lòng.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-medium text-slate-500 dark:text-slate-400 sm:gap-6">
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /><span>Thợ xác thực CCCD &amp; tay nghề</span></div>
            <div className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" /><span>Khảo sát &amp; báo giá trước khi làm</span></div>
          </div>
        </div>
        <div className="mt-7 w-full max-w-4xl min-w-0 sm:mt-8">
          <HeroSearchForm />
        </div>
      </div>
    </section>
  );
}
