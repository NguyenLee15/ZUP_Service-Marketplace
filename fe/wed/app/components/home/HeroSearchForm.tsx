'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

const QUICK_SEARCHES = ['Vệ sinh máy lạnh', 'Sửa điện nước', 'Dọn dẹp nhà'];
const SEARCH_PLACEHOLDER = 'Sửa máy lạnh chảy nước…';

export function HeroSearchForm() {
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
            placeholder={SEARCH_PLACEHOLDER}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
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
            onChange={(event) => setLocation(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-action-blue/40 rounded-lg text-midnight-indigo placeholder-slate-blue/70 text-base sm:text-lg font-semibold"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-5 w-full">
        <div className="grid w-full grid-cols-1 items-center gap-2 min-[480px]:grid-cols-2 sm:flex sm:w-auto sm:flex-wrap sm:justify-center md:justify-start">
          <span className="text-center text-xs font-bold text-slate-blue uppercase tracking-[0.16em] min-[480px]:col-span-2 sm:col-span-1 sm:text-left">Gợi ý:</span>
          {QUICK_SEARCHES.map((tag) => (
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
  );
}
