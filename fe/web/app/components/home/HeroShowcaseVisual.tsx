import { ShieldCheck, Star, Clock, CheckCircle2, Award, Wrench, Sparkles } from 'lucide-react';

export function HeroShowcaseVisual() {
  return (
    <div className="relative w-full max-w-md mx-auto lg:max-w-none">
      {/* Decorative ambient glow behind cards */}
      <div 
        className="absolute -top-10 -right-10 h-72 w-72 rounded-full bg-sky-400/15 blur-3xl pointer-events-none dark:bg-sky-500/10" 
        aria-hidden="true" 
      />
      <div 
        className="absolute -bottom-10 -left-10 h-64 w-64 rounded-full bg-indigo-400/10 blur-3xl pointer-events-none dark:bg-indigo-500/10" 
        aria-hidden="true" 
      />

      {/* Floating Trust Card 1: Top Right */}
      <div className="absolute -top-4 -right-2 sm:-right-4 z-20 hidden sm:flex items-center gap-2.5 rounded-xl border border-emerald-200/90 bg-white/95 px-3.5 py-2 shadow-lg shadow-emerald-500/5 backdrop-blur-md dark:border-emerald-800/80 dark:bg-slate-900/95 transition-transform duration-300 hover:scale-[1.02]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Báo giá minh bạch</p>
          <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Không phụ phí ẩn</p>
        </div>
      </div>

      {/* Main Showcase Card: Technician Spotlight */}
      <div className="relative z-10 overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-xl shadow-slate-200/60 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-none">
        {/* Header ribbon */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              120+ Thợ đang trực tuyến
            </span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
            <Award className="h-3 w-3" /> Chuẩn nghề ZUP
          </span>
        </div>

        {/* Technician Profile Snapshot */}
        <div className="mt-5 flex items-start gap-4">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-600 text-lg font-black text-white shadow-md shadow-sky-600/20">
            NVT
            <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900" title="Đã xác thực CCCD">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-base font-bold text-slate-900 dark:text-slate-100">
                Nguyễn Văn Tuấn
              </h2>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                4.95
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Kỹ thuật viên Điện Lạnh &amp; Thiết Bị Gia Đình
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium dark:bg-slate-800">
                <Wrench className="h-3 w-3 text-sky-600 dark:text-sky-400" /> 7 năm kinh nghiệm
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-medium dark:bg-slate-800">
                <Clock className="h-3 w-3 text-sky-600 dark:text-sky-400" /> Có mặt &lt; 30p
              </span>
            </div>
          </div>
        </div>

        {/* Live Service Request Example */}
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800/80 dark:bg-slate-800/50">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Đơn dịch vụ vừa hoàn thành</span>
            <span className="text-[11px] text-slate-400">12 phút trước</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Bảo dưỡng máy lạnh Inverter</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Quận 7, TP. Hồ Chí Minh</p>
            </div>
            <span className="rounded-lg bg-emerald-100/80 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              150.000đ
            </span>
          </div>
        </div>

        {/* Three Pillars Summary */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center dark:border-slate-800/80">
          <div className="rounded-xl p-1.5">
            <span className="block text-base font-extrabold text-sky-600 dark:text-sky-400">98.8%</span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Hài lòng</span>
          </div>
          <div className="rounded-xl p-1.5 border-x border-slate-100 dark:border-slate-800">
            <span className="block text-base font-extrabold text-sky-600 dark:text-sky-400">&lt; 15p</span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Phản hồi</span>
          </div>
          <div className="rounded-xl p-1.5">
            <span className="block text-base font-extrabold text-sky-600 dark:text-sky-400">10k+</span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight">Lượt thợ</span>
          </div>
        </div>
      </div>

      {/* Floating Trust Card 2: Bottom Left */}
      <div className="absolute -bottom-4 -left-2 sm:-left-4 z-20 hidden sm:flex items-center gap-2.5 rounded-xl border border-sky-200/90 bg-white/95 px-3.5 py-2 shadow-lg shadow-sky-500/5 backdrop-blur-md dark:border-sky-800/80 dark:bg-slate-900/95 transition-transform duration-300 hover:scale-[1.02]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Bảo vệ đơn hàng 24h</p>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Chỉ nghiệm thu khi ưng ý</p>
        </div>
      </div>
    </div>
  );
}

