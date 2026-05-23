import { HeroSearchForm } from '@/app/components/home/HeroSearchForm';

const TRUST_BADGE_USERS = [
  { text: 'T', bg: 'bg-gradient-to-tr from-orange-400 to-amber-500' },
  { text: 'M', bg: 'bg-gradient-to-tr from-pink-500 to-rose-400' },
  { text: 'K', bg: 'bg-gradient-to-tr from-emerald-400 to-teal-500' },
  { text: 'A', bg: 'bg-gradient-to-tr from-blue-500 to-indigo-400' },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[560px] sm:min-h-[600px] lg:min-h-[640px] flex items-center justify-center text-white overflow-hidden bg-[#101415]">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(2,132,199,0.24),transparent_34rem),radial-gradient(circle_at_72%_28%,rgba(6,182,212,0.16),transparent_22rem),linear-gradient(180deg,#101415_0%,#0b0f10_100%)]" />
        <div className="absolute left-1/2 top-1/2 h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-600/20 blur-[110px] pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#101415] to-transparent" />
      </div>

      <div className="relative z-10 px-4 md:px-6 max-w-6xl w-full mx-auto flex flex-col items-center text-center pt-8 pb-12 lg:pt-12 lg:pb-16">
        <div className="mobile-safe-max flex items-center gap-2 mb-5 bg-white/10 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full shadow-lg shadow-slate-950/20 animate-fade-in">
          <div className="flex -space-x-2">
            {TRUST_BADGE_USERS.map((user) => (
              <div
                key={user.text}
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-action-blue ${user.bg} text-[10px] font-black text-white shadow-sm select-none`}
                aria-hidden="true"
              >
                {user.text}
              </div>
            ))}
          </div>
          <span className="text-xs sm:text-sm font-semibold text-white/90 ml-1 truncate">
            <span className="hidden sm:inline">
              <span className="text-white font-bold">10,000+</span> hộ gia đình đã tin dùng
            </span>
            <span className="sm:hidden">
              <span className="text-white font-bold">10,000+</span> gia đình tin dùng
            </span>
          </span>
        </div>

        <h1 className="mx-auto max-w-[360px] sm:max-w-none text-[2.2rem] min-[420px]:text-4xl sm:text-6xl md:text-7xl lg:text-[72px] font-extrabold mb-5 sm:mb-6 text-white drop-shadow-2xl tracking-normal leading-[1.1] text-balance">
          Mọi dịch vụ bạn cần, <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-teal-400">
            ngay tại ngôi nhà bạn
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white/95 mb-8 sm:mb-10 max-w-2xl drop-shadow-md font-medium text-balance leading-relaxed">
          Nền tảng kết nối dịch vụ tiện ích số 1 Việt Nam. Nhanh chóng, an toàn và minh bạch.
        </p>

        <HeroSearchForm />
      </div>
    </section>
  );
}
