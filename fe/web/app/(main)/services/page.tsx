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

export default function ServicesSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-action-blue border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ServicesSearchContent />
    </Suspense>
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
    <div className="min-h-screen bg-background">
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
                <h2 className="text-2xl sm:text-3xl font-bold brand-heading leading-tight flex items-center gap-3 break-words text-balance">
                  {searchParams.get('keyword') ? (
                    <>
                      Kết quả {searchParams.get('ai') === 'true' ? 'AI ' : ''}cho &quot;
                      {searchParams.get('keyword')}&quot;
                    </>
                  ) : activeCategories.length === 1 ? (
                    <>{activeCategories[0].name}</>
                  ) : activeCategories.length > 1 ? (
                    <>{activeCategories.length} danh mục đã chọn</>
                  ) : (
                    <>Tất cả dịch vụ</>
                  )}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground font-medium text-pretty">
                  {locationDescription}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-[#101827] text-slate-100 shadow-sm hover:border-cyan-300/35 focus:ring-cyan-300/30 sm:w-[180px]">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#101827] text-slate-100 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                    <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                    <SelectItem value="rating">Đánh giá cao</SelectItem>
                  </SelectContent>
                </Select>

                <div className="grid w-full grid-cols-2 gap-1 bg-pale-gray p-1 rounded-xl border border-platinum-tint sm:w-auto">
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg px-3 h-8 ${
                      viewMode === 'grid' ? 'bg-white shadow-sm text-action-blue' : 'text-slate-blue'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Lưới
                  </Button>
                  <Button
                    variant={viewMode === 'map' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className={`rounded-lg px-3 h-8 ${
                      viewMode === 'map' ? 'bg-white shadow-sm text-action-blue' : 'text-slate-blue'
                    }`}
                  >
                    <MapIcon className="w-4 h-4 mr-2" />
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
