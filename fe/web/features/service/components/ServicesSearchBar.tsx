'use client';

import React from 'react';
import { Filter, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LocationSelector } from '@/app/components/services/LocationSelector';
import { ServiceFilterSidebar } from '@/app/components/services/ServiceFilterSidebar';
import type { Category } from '@/types';
import type { UserLocationState } from '../hooks/useServicesSearchFlow';

interface ServicesSearchBarProps {
  loading: boolean;
  searchParams: {
    get: (key: string) => string | null;
    toString: () => string;
  };
  onSearchSubmit: (keyword: string) => void;
  onToggleAi: () => void;
  userLocation: UserLocationState;
  setUserLocation: React.Dispatch<React.SetStateAction<UserLocationState>>;
  savedAddresses: ApiPayload[];
  fetchGpsLocation: () => void;
  isMobileFilterOpen: boolean;
  setIsMobileFilterOpen: (open: boolean) => void;
  activeFilterCount: number;
  categories: Category[];
  onFilterChange: (filters: ApiPayload) => void;
  onClearFilters: () => void;
  categoryIds: string[];
  minPrice: string;
  maxPrice: string;
  minRating: number;
  metaTotal: number;
}

export function ServicesSearchBar({
  loading,
  searchParams,
  onSearchSubmit,
  onToggleAi,
  userLocation,
  setUserLocation,
  savedAddresses,
  fetchGpsLocation,
  isMobileFilterOpen,
  setIsMobileFilterOpen,
  activeFilterCount,
  categories,
  onFilterChange,
  onClearFilters,
  categoryIds,
  minPrice,
  maxPrice,
  minRating,
  metaTotal,
}: ServicesSearchBarProps) {
  const isAiMode = searchParams.get('ai') === 'true';

  return (
    <div className="bg-white border-b border-platinum-tint">
      <div className="max-w-7xl mx-auto px-0 py-4 sm:px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4 flex-1">
            <div className="hidden xl:block min-w-[180px]">
              <p className="text-xs font-bold text-muted-foreground">ZUP</p>
              <h1 className="text-lg font-bold tracking-tight text-midnight-indigo">
                Tìm dịch vụ tại nhà
              </h1>
            </div>
            <div className="relative min-w-0 flex-1 max-w-2xl group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search
                  className={`w-5 h-5 transition-colors duration-300 ${
                    loading
                      ? 'text-action-blue'
                      : 'text-muted-foreground group-focus-within:text-action-blue'
                  }`}
                />
              </div>
              <Input
                id="main-search-input"
                name="services-search"
                aria-label="Tìm kiếm dịch vụ"
                autoComplete="off"
                placeholder="Tìm kiếm dịch vụ…"
                className="pl-12 pr-24 h-14 bg-cloud-mist border border-platinum-tint focus:border-action-blue focus:ring-action-blue/20 rounded-2xl text-base shadow-sm transition-[background-color,border-color,box-shadow] hover:bg-pale-gray/60 group-focus-within:bg-white group-focus-within:shadow-md"
                defaultValue={searchParams.get('keyword') || ''}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSearchSubmit(e.currentTarget.value);
                  }
                }}
              />
              <button
                type="button"
                onClick={onToggleAi}
                aria-label={isAiMode ? 'Tắt tìm kiếm AI' : 'Bật tìm kiếm AI'}
                title="Tìm bằng AI"
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-[background-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue ${
                  isAiMode
                    ? 'bg-amber-pop/20 text-amber-500'
                    : 'text-muted-foreground hover:text-amber-500 hover:bg-amber-pop/10'
                }`}
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex w-full items-center gap-3 md:w-auto md:pl-4 md:border-l border-border">
            <LocationSelector
              currentSource={userLocation.source}
              currentLabel={userLocation.label}
              savedAddresses={savedAddresses}
              onSelectManual={(lat, lng, label) =>
                setUserLocation({ lat, lng, source: 'manual', label })
              }
              onSelectGps={() => {
                setUserLocation((prev) => ({ ...prev, source: 'fallback', label: 'Hà Nội' }));
                fetchGpsLocation();
              }}
            />

            <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Mở bộ lọc"
                  className="relative h-12 w-12 rounded-xl border-platinum-tint hover:bg-pale-gray hover:text-action-blue transition-colors"
                >
                  <Filter className="w-5 h-5" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-action-blue px-1 text-[10px] font-bold text-white">
                      {activeFilterCount > 9 ? '9+' : activeFilterCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[min(22rem,calc(100vw_-_1rem))] border-l border-white/10 bg-slate-950/95 p-0 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
              >
                <SheetHeader className="border-b border-white/10 bg-white/[0.03] p-5">
                  <SheetTitle className="text-left text-lg font-bold tracking-tight text-white">
                    Bộ lọc tìm kiếm
                  </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto h-full pb-20">
                  <ServiceFilterSidebar
                    categories={categories}
                    onFilterChange={onFilterChange}
                    onClear={onClearFilters}
                    currentFilters={{ categoryIds, minPrice, maxPrice, minRating }}
                  />
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden md:flex items-center gap-2 px-4 h-12 bg-pale-gray rounded-xl border border-platinum-tint">
              <Sparkles className="w-4 h-4 text-action-blue" />
              <span className="text-xs font-bold text-glacier-blue whitespace-nowrap">
                {metaTotal} kết quả tìm thấy
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

