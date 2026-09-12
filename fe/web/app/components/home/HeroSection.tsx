import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Compass } from 'lucide-react';
import { HeroSearchForm } from './HeroSearchForm';

export function HeroSection() {
  return (
    <section className="relative min-h-[480px] sm:min-h-[520px] lg:min-h-[580px] flex items-center justify-center text-white overflow-hidden bg-slate-950">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero_bg.webp"
          alt="Nền tảng kết nối dịch vụ tiện ích tại nhà HomeServe uy tín"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover opacity-25 select-none pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/90 to-slate-950" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950 to-transparent" />
      </div>

      <div className="relative z-10 px-4 md:px-6 max-w-5xl w-full mx-auto flex flex-col items-center text-center pt-8 pb-12 lg:pt-14 lg:pb-16">
        {/* Subtle Trust Badge */}
        <div className="inline-flex items-center gap-2 mb-6 bg-white/[0.07] border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md shadow-sm">
          <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-medium text-slate-200">
            Dịch vụ tại nhà minh bạch, thợ xác thực lý lịch
          </span>
        </div>

        <h1 className="max-w-3xl text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4 leading-[1.15] text-balance">
          Tìm dịch vụ sửa chữa tại nhà, <br className="hidden sm:block" />
          <span className="text-sky-400">
            minh bạch từ lúc đặt lịch.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed text-balance">
          HomeServe giúp bạn tìm thợ lành nghề, khảo sát báo giá rõ ràng và theo dõi tiến độ công việc an tâm ngay trên ứng dụng.
        </p>

        {/* Integrated Hero Search Form */}
        <div className="w-full max-w-3xl mb-8">
          <HeroSearchForm />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto">
          <Link
            href="/services"
            aria-label="Đặt lịch dịch vụ tại nhà ngay cùng HomeServe"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm sm:text-base shadow-sm transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <span>Khám phá tất cả dịch vụ</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>

          <a
            href="#danh-muc-dich-vu"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] text-slate-200 hover:text-white font-semibold text-sm sm:text-base transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <Compass className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span>Danh mục phổ biến</span>
          </a>
        </div>
      </div>
    </section>
  );
}
