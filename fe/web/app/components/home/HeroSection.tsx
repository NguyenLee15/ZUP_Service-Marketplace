import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { HeroSearchForm } from './HeroSearchForm';

export function HeroSection() {
  return (
    <section 
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-slate-50/90 via-slate-50/50 to-white py-10 dark:border-slate-800/70 dark:from-slate-950 dark:via-slate-950/80 dark:to-slate-900 sm:py-14 lg:py-16"
    >
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Centered Heading Block */}
        <div className="flex flex-col items-center text-center">
          {/* Trust Badge */}
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50 px-3.5 py-1.5 shadow-xs dark:border-sky-800/80 dark:bg-sky-950/50">
            <ShieldCheck className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-sky-800 dark:text-sky-300 sm:text-sm">
              Nền tảng dịch vụ tiện ích gia đình chuẩn mực ZUP
            </span>
          </div>

          {/* Headline H1 */}
          <h1 
            id="hero-title"
            className="mt-5 max-w-3xl text-balance text-3xl font-extrabold leading-[1.12] tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl lg:text-[3.5rem]"
          >
            Dịch vụ gia đình chuẩn mực,{' '}
            <span className="text-sky-600 dark:text-sky-400">thợ lành nghề tận tâm.</span>
          </h1>

          {/* Value Proposition */}
          <p className="mt-4 max-w-2xl text-balance text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-base md:text-lg">
            ZUP giúp bạn kết nối nhanh với thợ sửa chữa, vệ sinh và bảo dưỡng tại nhà. Báo giá minh bạch, khảo sát tận nơi và chỉ nghiệm thu khi hoàn toàn hài lòng.
          </p>

          {/* Three Commitments */}
          <ul 
            aria-label="Cam kết chất lượng dịch vụ ZUP"
            className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600 dark:text-slate-400 sm:gap-x-6 sm:text-sm"
          >
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Thợ xác thực CCCD &amp; tay nghề</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Khảo sát &amp; báo giá trước khi làm</span>
            </li>
            <li className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Bảo vệ đơn hàng 24h</span>
            </li>
          </ul>
        </div>

        {/* Primary Search Form */}
        <div className="mx-auto mt-8 w-full max-w-4xl min-w-0">
          <HeroSearchForm />
        </div>

        {/* Integrated Trust Metrics Strip */}
        <dl 
          aria-label="Chỉ số tin cậy của ZUP"
          className="mx-auto mt-8 grid w-full max-w-3xl grid-cols-2 divide-y divide-slate-200/80 border-t border-slate-200/80 pt-6 dark:divide-slate-800 dark:border-slate-800 sm:grid-cols-4 sm:divide-y-0 sm:divide-x"
        >
          <div className="py-2 text-center sm:py-0 sm:px-4">
            <dd className="text-xl font-extrabold text-sky-600 dark:text-sky-400 sm:text-2xl">120+</dd>
            <dt className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Thợ trực tuyến</dt>
          </div>
          <div className="py-2 text-center sm:py-0 sm:px-4">
            <dd className="text-xl font-extrabold text-sky-600 dark:text-sky-400 sm:text-2xl">98.8%</dd>
            <dt className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Khách hài lòng</dt>
          </div>
          <div className="py-2 text-center sm:py-0 sm:px-4">
            <dd className="text-xl font-extrabold text-sky-600 dark:text-sky-400 sm:text-2xl">&lt; 15p</dd>
            <dt className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Thời gian phản hồi</dt>
          </div>
          <div className="py-2 text-center sm:py-0 sm:px-4">
            <dd className="text-xl font-extrabold text-sky-600 dark:text-sky-400 sm:text-2xl">10.000+</dd>
            <dt className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">Lượt phục vụ</dt>
          </div>
        </dl>
      </div>
    </section>
  );
}
