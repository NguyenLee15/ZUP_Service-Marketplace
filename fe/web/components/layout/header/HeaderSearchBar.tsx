'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Sparkles } from 'lucide-react';
import { useScrollPastHero } from '@/hooks/useScrollPastHero';

export function HeaderSearchBar() {
  const [keyword, setKeyword] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const pastHero = useScrollPastHero();

  const isServicesPage = pathname === '/services';
  const isHomePage = pathname === '/';

  // Contextual search visibility:
  // - On /services: hidden (page has dedicated search bar)
  // - On homepage (/): hidden at top of page, reveals when scrolled past Hero
  // - On other pages (/bookings, /profile, etc.): always visible
  const shouldShow = isServicesPage ? false : isHomePage ? pastHero : true;

  if (!shouldShow) {
    return null;
  }

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (keyword.trim()) {
      router.push(
        `/services?keyword=${encodeURIComponent(keyword.trim())}${
          aiMode ? '&ai=true' : ''
        }`
      );
      return;
    }
    router.push('/services');
  };

  return (
    <div className="hidden sm:block flex-1 max-w-xl px-2 animate-in fade-in duration-200">
      <form
        onSubmit={handleSearch}
        role="search"
        id="header-search-form"
        className="relative group"
      >
        <div className="relative flex items-center rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 focus-within:border-sky-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-sky-500/20 transition-[background-color,border-color,box-shadow] duration-200">
          <Search className="w-4 h-4 ml-3.5 text-slate-400 dark:text-slate-500 shrink-0 pointer-events-none" />
          <input
            type="text"
            name="search"
            aria-label="Tìm kiếm dịch vụ trên ZUP"
            autoComplete="off"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm thợ sửa chữa, vệ sinh, lắp đặt…"
            className="w-full bg-transparent py-2 pl-2.5 pr-20 text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none"
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAiMode(!aiMode)}
              title={aiMode ? 'Đang bật AI Search' : 'Bật AI Search'}
              aria-label={aiMode ? 'Tắt tìm kiếm bằng trợ lý AI ZUP' : 'Bật tìm kiếm bằng trợ lý AI ZUP'}
              aria-pressed={aiMode}
              className={`p-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer ${
                aiMode
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="submit"
              aria-label="Thực hiện tìm kiếm dịch vụ"
              className="p-2 bg-sky-600 hover:bg-sky-500 text-white rounded-full shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

