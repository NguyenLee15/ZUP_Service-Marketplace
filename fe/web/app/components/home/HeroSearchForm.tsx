'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useRecentSearches } from '@/hooks/useRecentSearches';

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
  const { recentSearches, addSearch } = useRecentSearches();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const data = new FormData(event.currentTarget);
    addSearch(String(data.get('keyword') ?? ''));
  };

  return (
    <form
      action="/services"
      method="get"
      onSubmit={handleSubmit}
      role="search"
      id="hero-search-form"
      className="w-full rounded-2xl border border-slate-200/90 bg-white p-2 shadow-lg shadow-slate-200/50 transition-[border-color,box-shadow] duration-200 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none sm:p-2.5"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1fr_13rem_auto] gap-2 items-center">
        {/* Keyword Search Field */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 transition-[background-color,border-color,box-shadow] focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/20 dark:border-slate-700/80 dark:bg-slate-800/60 dark:focus-within:bg-slate-900">
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
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 transition-[background-color,border-color,box-shadow] focus-within:border-sky-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-sky-500/20 dark:border-slate-700/80 dark:bg-slate-800/60 dark:focus-within:bg-slate-900">
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
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] hover:bg-sky-500 hover:shadow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:h-auto sm:text-base"
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
      {recentSearches.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-1 pt-2 sm:px-1.5" aria-label="Tìm kiếm gần đây">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Gần đây:</span>
          {recentSearches.map((item) => (
            <Link key={item} href={getQuickSearchHref(item)} className="text-xs text-sky-700 underline-offset-2 hover:underline dark:text-sky-400">
              {item}
            </Link>
          ))}
        </div>
      )}
    </form>
  );
}
