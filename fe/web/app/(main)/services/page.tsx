'use client';

import React, { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LayoutGrid, Map as MapIcon } from 'lucide-react';
import { useServicesSearchFlow } from '@/features/service/hooks/useServicesSearchFlow';
import { ServicesSearchBar } from '@/features/service/components/ServicesSearchBar';
import { ServicesActiveFilters } from '@/features/service/components/ServicesActiveFilters';
import { ServicesSearchResults } from '@/features/service/components/ServicesSearchResults';
import { ServicesFloatingFilterButton } from '@/features/service/components/ServicesFloatingFilterButton';
import { CustomerPageHeader } from '@/components/customer/CustomerPageHeader';

export default function ServicesSearchPage() {
  return (
    <Suspense fallback={<ServicesSearchSkeleton />}>
      <ServicesSearchContent />
    </Suspense>
  );
}

function ServicesSearchSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="h-10 w-full max-w-md bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="hidden sm:flex items-center gap-3">
            <div className="h-10 w-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-10 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 sm:gap-6 mb-8">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-36 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            <div className="h-10 w-28 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="h-[260px] sm:h-[300px] bg-slate-100/80 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-4 flex flex-col justify-between overflow-hidden"
            >
              <div className="space-y-3">
                <div className="h-32 bg-slate-200/70 dark:bg-slate-700/50 rounded-xl animate-pulse" />
                <div className="h-4 w-3/4 bg-slate-200/70 dark:bg-slate-700/50 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-200/50 dark:bg-slate-700/30 rounded animate-pulse" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="h-4 w-20 bg-slate-200/70 dark:bg-slate-700/50 rounded animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-slate-200/70 dark:bg-slate-700/50 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServicesSearchContent() {
  const {
    router,
    searchParams,
    services,
    categories,
    savedAddresses,
    loading,
    searchError,
    meta,
    isFetchingMore,
    viewMode,
    setViewMode,
    userLocation,
    setUserLocation,
    fetchGpsLocation,
    observerTarget,
    favorites,
    toggleFavoriteService,
    addRecentlyViewed,
    categoryIds,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
    setSortBy,
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    showFloatingFilter,
    formatPrice,
    handleSearchRef,
    onFilterChange,
    onClearFilters,
    removeFilter,
    activeCategories,
    activeFilterCount,
    locationDescription,
  } = useServicesSearchFlow();

  const handleSearchSubmit = (keyword: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('keyword', keyword);
    router.push(`/services?${newParams.toString()}`);
  };

  const handleToggleAi = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (newParams.get('ai') === 'true') {
      newParams.delete('ai');
    } else {
      newParams.set('ai', 'true');
    }
    router.push(`/services?${newParams.toString()}`);
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Search Header Bar */}
      <ServicesSearchBar
        loading={loading}
        searchParams={searchParams}
        onSearchSubmit={handleSearchSubmit}
        onToggleAi={handleToggleAi}
        userLocation={userLocation}
        setUserLocation={setUserLocation}
        savedAddresses={savedAddresses}
        fetchGpsLocation={fetchGpsLocation}
        isMobileFilterOpen={isMobileFilterOpen}
        setIsMobileFilterOpen={setIsMobileFilterOpen}
        activeFilterCount={activeFilterCount}
        categories={categories}
        onFilterChange={onFilterChange}
        onClearFilters={onClearFilters}
        categoryIds={categoryIds}
        minPrice={minPrice}
        maxPrice={maxPrice}
        minRating={minRating}
        metaTotal={meta.total}
      />

      <div className="max-w-7xl mx-auto px-0 py-6 sm:px-4 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-12">
            {/* Heading & View Mode / Sort Controls */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 sm:gap-6 mb-6">
              <div className="min-w-0 space-y-1">
                <CustomerPageHeader
                  eyebrow="Khám phá dịch vụ"
                  title={
                    searchParams.get('keyword')
                      ? `Kết quả ${searchParams.get('ai') === 'true' ? 'AI ' : ''}cho "${searchParams.get('keyword')}"`
                      : activeCategories.length === 1
                        ? activeCategories[0].name
                        : activeCategories.length > 1
                          ? `${activeCategories.length} danh mục đã chọn`
                          : 'Tất cả dịch vụ'
                  }
                  description={locationDescription}
                />
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xs hover:border-sky-500/40 focus:ring-sky-500/20 sm:w-[180px]">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-md">
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                    <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                    <SelectItem value="rating">Đánh giá cao</SelectItem>
                  </SelectContent>
                </Select>

                <div className="grid w-full grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 sm:w-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg px-3 h-8 text-xs font-semibold ${
                      viewMode === 'grid' ? 'bg-white dark:bg-slate-900 shadow-xs text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 mr-1.5" />
                    Lưới
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className={`rounded-lg px-3 h-8 text-xs font-semibold ${
                      viewMode === 'map' ? 'bg-white dark:bg-slate-900 shadow-xs text-sky-600 dark:text-sky-400' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <MapIcon className="w-4 h-4 mr-1.5" />
                    Bản đồ
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filter Badges */}
            <ServicesActiveFilters
              activeCategories={activeCategories}
              minPrice={minPrice}
              maxPrice={maxPrice}
              minRating={minRating}
              formatPrice={formatPrice}
              removeFilter={removeFilter}
              onClearFilters={onClearFilters}
            />

            {/* Error Banner */}
            {searchError && (
              <div
                role="status"
                aria-live="polite"
                className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold">Không tải được dữ liệu dịch vụ</p>
                  <p className="text-sm text-amber-800">{searchError}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSearchRef.current(1)}
                  className="shrink-0 border-amber-300 bg-white hover:bg-amber-100 transition-colors"
                >
                  Thử lại
                </Button>
              </div>
            )}

            {/* Service Cards / Map */}
            <ServicesSearchResults
              viewMode={viewMode}
              services={services}
              userLocation={userLocation}
              loading={loading}
              isFetchingMore={isFetchingMore}
              meta={meta}
              favorites={favorites}
              toggleFavoriteService={toggleFavoriteService}
              addRecentlyViewed={addRecentlyViewed}
              onClearFilters={onClearFilters}
              observerTarget={observerTarget}
            />
          </div>
        </div>
      </div>

      {/* Floating Filter Button (Mobile) */}
      <ServicesFloatingFilterButton
        showFloatingFilter={showFloatingFilter}
        setIsMobileFilterOpen={setIsMobileFilterOpen}
        activeFilterCount={activeFilterCount}
      />
    </div>
  );
}
