'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const SEARCH_SUGGESTIONS = [
  "Sửa máy lạnh chảy nước…",
  "Dọn dẹp nhà sau tiệc…",
  "Lắp đặt camera an ninh…",
  "Thông tắc bồn cầu gấp…",
  "Thợ điện nước gần nhất…"
];

export function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Hà Nội');

  const buildServicesHref = (keyword?: string) => {
    const params = new URLSearchParams();
    const normalizedKeyword = keyword?.trim() || searchQuery.trim();
    const normalizedLocation = location.trim();

    if (normalizedKeyword) params.set('keyword', normalizedKeyword);
    if (normalizedLocation) params.set('location', normalizedLocation);

    const query = params.toString();
    return query ? `/services?${query}` : '/services';
  };

  const handleSearch = (event?: FormEvent) => {
    event?.preventDefault();
    router.push(buildServicesHref());
  };

  const handleQuickSearch = (keyword: string) => {
    router.push(buildServicesHref(keyword));
  };

  return (
    <section className="relative min-h-[560px] sm:min-h-[600px] lg:min-h-[640px] flex items-center justify-center text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero_bg.webp"
          alt="Không gian nhà ở sạch sẽ sau khi sử dụng dịch vụ tại nhà"
          width={1024}
          height={1024}
          priority
          fetchPriority="high"
          sizes="100vw"
          className="h-full w-full object-cover md:scale-105 md:animate-ken-burns"
        />
        <div className="absolute inset-0 bg-midnight-indigo/55"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-midnight-indigo/35 to-midnight-indigo/75"></div>
      </div>

      <div className="relative z-10 px-4 md:px-6 max-w-6xl w-full mx-auto flex flex-col items-center text-center pt-8 pb-12 lg:pt-12 lg:pb-16">
        <div className="mobile-safe-max flex items-center gap-2 mb-5 bg-white/12 backdrop-blur-md border border-white/25 px-3.5 py-1.5 rounded-full shadow-lg shadow-slate-950/20 animate-fade-in">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-action-blue bg-pale-gray overflow-hidden">
                <Image src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="" width={28} height={28} aria-hidden="true" />
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

        <form
          onSubmit={handleSearch}
          className="mobile-viewport-width surface-card-elevated bg-white/95 backdrop-blur-2xl rounded-[1.25rem] sm:rounded-3xl p-3.5 sm:p-5 md:p-6 max-w-5xl transition-[background-color,box-shadow] duration-300 group/form"
        >
          <div className="grid md:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div className="md:col-span-2 flex items-center gap-3 sm:gap-4 bg-cloud-mist rounded-2xl px-4 sm:px-5 py-4 sm:py-5 border border-platinum-tint group focus-within:ring-4 focus-within:ring-action-blue/15 focus-within:border-action-blue transition-[box-shadow,border-color]">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 text-action-blue group-focus-within:scale-105 transition-transform" />
              <input
                type="text"
                name="hero-search"
                aria-label="Tìm kiếm dịch vụ"
                autoComplete="off"
                placeholder={SEARCH_SUGGESTIONS[0]}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-action-blue/40 rounded-lg text-midnight-indigo placeholder-slate-blue/70 text-base sm:text-lg font-semibold"
              />
            </div>

            <div className="flex items-center gap-3 sm:gap-4 bg-cloud-mist rounded-2xl px-4 sm:px-5 py-4 sm:py-5 border border-platinum-tint group focus-within:ring-4 focus-within:ring-action-blue/15 focus-within:border-action-blue transition-[box-shadow,border-color]">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-action-blue group-focus-within:scale-105 transition-transform" />
              <input
                type="text"
                name="hero-location"
                aria-label="Vị trí tìm kiếm"
                autoComplete="street-address"
                placeholder="Vị trí…"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="min-w-0 flex-1 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-action-blue/40 rounded-lg text-midnight-indigo placeholder-slate-blue/70 text-base sm:text-lg font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-5 w-full">
            <div className="grid w-full grid-cols-1 items-center gap-2 min-[480px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-center md:justify-start">
              <span className="text-center text-xs font-bold text-slate-blue uppercase tracking-[0.16em] min-[480px]:col-span-2 sm:col-span-1 sm:text-left">Gợi ý:</span>
              {['Vệ sinh máy lạnh', 'Sửa điện nước', 'Dọn dẹp nhà'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickSearch(tag)}
                  className="inline-flex items-center justify-center px-3 sm:px-4 py-2 rounded-full bg-pale-gray hover:bg-action-blue border border-transparent text-glacier-blue hover:text-white text-xs sm:text-sm font-bold transition-[background-color,color,box-shadow,transform] hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  {tag}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="group relative justify-center px-6 py-3.5 rounded-xl bg-action-blue font-bold text-white shadow-[var(--brand-shadow-button)] hover:bg-glacier-blue hover:-translate-y-0.5 transition-[background-color,box-shadow,transform] overflow-hidden flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-2"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <Search className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Tìm dịch vụ</span>
            </button>
          </div>
        </form>
      </div>

    </section>
  );
}
