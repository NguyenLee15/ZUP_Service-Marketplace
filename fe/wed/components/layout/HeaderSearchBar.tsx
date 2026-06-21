'use client';

import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

/**
 * Compact search bar that sits permanently in the header for premium Shopee-style access.
 */
export function HeaderSearchBar() {
  const [aiMode, setAiMode] = useState(false);

  return (
    <div className="relative min-w-0 flex-1 max-w-2xl px-1 pr-12 sm:px-2 sm:pr-12 md:pr-0 group">
      <form action="/services" className="relative flex items-center">
        {aiMode && <input type="hidden" name="ai" value="true" />}
        <input
          type="text"
          name="keyword"
          aria-label="Tìm kiếm dịch vụ"
          autoComplete="off"
          placeholder="Hôm nay bạn cần giúp gì?…"
          className="w-full rounded-full border border-platinum-tint bg-cloud-mist py-1.5 pl-4 pr-20 text-xs text-foreground outline-none transition-colors hover:border-steel-gray focus:border-action-blue focus:bg-card focus-visible:ring-2 focus-visible:ring-action-blue sm:py-2.5 sm:pl-5 sm:pr-24 sm:text-sm md:text-base"
        />
        <div className="absolute right-1.5 sm:right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 sm:gap-2">
          <button 
            type="button"
            onClick={() => setAiMode(!aiMode)}
            aria-label={aiMode ? 'Tắt tìm kiếm AI' : 'Bật tìm kiếm AI'}
            title="Tìm bằng AI"
            className={`p-1.5 sm:p-2 rounded-full transition-[background-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue ${
              aiMode ? 'bg-amber-pop/20 text-amber-500' : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-pop/10'
            }`}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            type="submit"
            aria-label="Tìm kiếm"
            className="flex items-center justify-center rounded-full bg-action-blue p-1.5 text-white shadow-sm transition-colors hover:bg-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue sm:p-2"
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
