import Image from 'next/image';

import { HeroSearchForm } from '@/app/components/home/HeroSearchForm';

const TRUST_BADGE_USERS = [
  { text: 'T', bg: 'bg-gradient-to-tr from-orange-400 to-amber-500' },
  { text: 'M', bg: 'bg-gradient-to-tr from-pink-500 to-rose-400' },
  { text: 'K', bg: 'bg-gradient-to-tr from-emerald-400 to-teal-500' },
  { text: 'A', bg: 'bg-gradient-to-tr from-blue-500 to-indigo-400' },
];

export function HeroSection() {
  return (
    <section className="relative min-h-[560px] sm:min-h-[600px] lg:min-h-[640px] flex items-center justify-center text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero_bg.webp"
          alt="Không gian nhà ở sạch sẽ sau khi sử dụng dịch vụ tại nhà"
          width={1024}
          height={1024}
          priority
          unoptimized
          fetchPriority="high"
          sizes="100vw"
          className="h-full w-full object-cover md:scale-105 md:motion-safe:animate-ken-burns"
        />
        <div className="absolute inset-0 bg-midnight-indigo/55"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-midnight-indigo/35 to-midnight-indigo/75"></div>
      </div>

      <div className="relative z-10 px-4 md:px-6 max-w-6xl w-full mx-auto flex flex-col items-center text-center pt-8 pb-12 lg:pt-12 lg:pb-16">
        <div className="mobile-safe-max flex items-center gap-2 mb-5 bg-white/12 backdrop-blur-md border border-white/25 px-3.5 py-1.5 rounded-full shadow-lg shadow-slate-950/20 animate-fade-in">
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

        <h1 className="mx-auto max-w-[360px] sm:max-w-none text-[2rem] min-[420px]:text-4xl sm:text-5xl md:text-7xl lg:text-[80px] font-bold mb-5 sm:mb-6 text-white drop-shadow-2xl tracking-normal leading-[1.05] sm:leading-[1] text-balance">
          Dịch vụ tại nhà <br className="hidden md:block" />
          <span className="text-pale-gray">
            trong tầm tay <br className="md:hidden" />
            bạn
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8 sm:mb-10 max-w-2xl drop-shadow-md font-medium text-balance leading-relaxed">
          Nhập nhu cầu và khu vực, chúng tôi sẽ đưa bạn tới danh sách dịch vụ phù hợp để lọc, so sánh và đặt lịch.
        </p>

        <HeroSearchForm />
      </div>
    </section>
  );
}
