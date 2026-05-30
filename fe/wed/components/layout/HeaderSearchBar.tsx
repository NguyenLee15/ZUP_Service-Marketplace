'use client';

import { Search } from 'lucide-react';

/**
 * Compact search bar that sits permanently in the header for premium Shopee-style access.
 */
export function HeaderSearchBar() {
  return (
    <div className="relative min-w-0 flex-1 max-w-2xl px-1 pr-12 sm:px-2 sm:pr-12 md:pr-0">
      <form action="/services" className="relative">
        <input
          type="text"
          name="keyword"
          aria-label="Tìm kiếm dịch vụ"
          autoComplete="off"
          placeholder="Hôm nay bạn cần giúp gì?…"
          className="w-full rounded-full border border-platinum-tint bg-cloud-mist py-1.5 pl-4 pr-10 text-xs text-foreground outline-none transition-colors hover:border-steel-gray focus:border-action-blue focus:bg-card focus-visible:ring-2 focus-visible:ring-action-blue sm:py-2.5 sm:pl-5 sm:pr-14 sm:text-sm md:text-base"
        />
        <button
          type="submit"
          aria-label="Tìm kiếm"
          className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-full bg-action-blue p-1.5 text-white shadow-sm transition-colors hover:bg-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue sm:p-2 md:right-1.5"
        >
          <Search className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </form>
    </div>
  );
}
