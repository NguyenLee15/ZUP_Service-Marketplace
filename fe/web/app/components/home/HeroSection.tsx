import { ShieldCheck, CheckCircle2, Star } from 'lucide-react';
import { HeroSearchForm } from './HeroSearchForm';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/70 bg-slate-50 py-10 dark:border-slate-800/70 dark:bg-slate-950 sm:py-16 lg:py-20">
      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:px-8">
        {/* Subtle Trust Pill */}
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50 px-3.5 py-1.5 shadow-xs dark:border-sky-800/80 dark:bg-sky-950/50">
          <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-semibold text-sky-800 dark:text-sky-300">
            Nền tảng dịch vụ tiện ích gia đình chuẩn mực ZUP
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="mt-5 text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-6xl text-balance">
          Dịch vụ gia đình chuẩn mực, <br className="hidden sm:block" />
          <span className="text-sky-600 dark:text-sky-400">thợ lành nghề tận tâm.</span>
        </h1>

        {/* Subtitle */}
        <p className="mb-8 mt-5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base md:text-lg text-balance">
          ZUP giúp bạn kết nối nhanh với thợ sửa chữa, vệ sinh và bảo dưỡng tại nhà. Báo giá minh bạch, khảo sát tận nơi và chỉ nghiệm thu khi hoàn toàn hài lòng.
        </p>

        {/* Hero Search Form */}
        <div className="mb-8 w-full max-w-3xl lg:col-start-2 lg:row-start-1">
          <HeroSearchForm />
        </div>

        {/* Trust Badges Row */}
        <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-medium text-slate-500 dark:text-slate-400 sm:gap-8 lg:col-span-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Thợ xác thực CCCD & tay nghề</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Khảo sát & báo giá trước khi làm</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <span>4.9/5 từ hàng nghìn gia đình</span>
          </div>
        </div>
      </div>
    </section>
  );
}
