import Link from 'next/link';
import { ShieldCheck, ArrowRight, CheckCircle2, Star } from 'lucide-react';
import { HeroSearchForm } from './HeroSearchForm';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200/70 dark:border-slate-800/70 py-10 sm:py-16 lg:py-20">
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Subtle Trust Pill */}
        <div className="inline-flex items-center gap-2 mb-6 bg-sky-50 dark:bg-sky-950/50 border border-sky-200/80 dark:border-sky-800/80 px-3.5 py-1.5 rounded-full shadow-xs">
          <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-semibold text-sky-800 dark:text-sky-300">
            Nền tảng dịch vụ tiện ích gia đình chuẩn mực ZUP
          </span>
        </div>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 mb-4 leading-[1.18] text-balance">
          Dịch vụ gia đình chuẩn mực, <br className="hidden sm:block" />
          <span className="text-sky-600 dark:text-sky-400">thợ lành nghề tận tâm.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-2xl leading-relaxed text-balance">
          ZUP giúp bạn kết nối nhanh với thợ sửa chữa, vệ sinh và bảo dưỡng tại nhà. Báo giá minh bạch, khảo sát tận nơi và chỉ nghiệm thu khi hoàn toàn hài lòng.
        </p>

        {/* Hero Search Form */}
        <div className="w-full max-w-3xl mb-8">
          <HeroSearchForm />
        </div>

        {/* Trust Badges Row */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-2 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
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
