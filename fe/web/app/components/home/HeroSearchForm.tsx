import Link from 'next/link';
import { Search, MapPin } from 'lucide-react';

const QUICK_SEARCHES = ['Vệ sinh máy lạnh', 'Sửa điện nước', 'Dọn dẹp nhà', 'Thông tắc bồn cầu'];
const SEARCH_PLACEHOLDER = 'Bạn cần sửa chữa hay vệ sinh thiết bị gì?…';
const DEFAULT_LOCATION = '';

function getQuickSearchHref(keyword: string) {
  const params = new URLSearchParams({ keyword });
  if (DEFAULT_LOCATION) {
    params.set('location', DEFAULT_LOCATION);
  }
  return `/services?${params.toString()}`;
}

export function HeroSearchForm() {
  return (
    <form
      action="/services"
      method="get"
      role="search"
      id="hero-search-form"
      className="w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-2 sm:p-2.5 shadow-lg shadow-slate-200/50 dark:shadow-none transition-all duration-200"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_13rem_auto] gap-2 items-center">
        {/* Keyword Search Field */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-sky-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
          <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            name="keyword"
            aria-label="Tìm kiếm dịch vụ trên ZUP"
            autoComplete="off"
            placeholder={SEARCH_PLACEHOLDER}
            className="min-w-0 flex-1 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm sm:text-base font-medium"
          />
        </div>

        {/* Location Field */}
        <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3.5 py-2.5 border border-slate-200/80 dark:border-slate-700/80 focus-within:border-sky-500 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
          <MapPin className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            name="location"
            aria-label="Khu vực dịch vụ"
            autoComplete="street-address"
            placeholder="Khu vực (tùy chọn)…"
            defaultValue={DEFAULT_LOCATION}
            className="min-w-0 flex-1 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm sm:text-base font-medium"
          />
        </div>

        {/* Search Submit Button */}
        <button
          type="submit"
          className="h-11 sm:h-auto py-3 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm sm:text-base shadow-sm hover:shadow transition-all active:scale-[0.98] flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span>Tìm thợ</span>
        </button>
      </div>

      {/* Quick Search Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-2.5 px-1 sm:px-1.5">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gợi ý phổ biến:</span>
        {QUICK_SEARCHES.map((tag) => (
          <Link
            key={tag}
            href={getQuickSearchHref(tag)}
            className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950 hover:text-sky-600 dark:hover:text-sky-400 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors"
          >
            {tag}
          </Link>
        ))}
      </div>
    </form>
  );
}
