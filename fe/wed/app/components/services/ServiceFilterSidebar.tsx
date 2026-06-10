'use client';

import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Category } from '@/types';
import { useState, useEffect } from 'react';
import { CategoryFilter } from './CategoryFilter';
import { PriceFilter } from './PriceFilter';
import { RatingFilter } from './RatingFilter';

interface ServiceFilterSidebarProps {
  categories: Category[];
  currentFilters: {
    categoryIds: string[];
    minPrice: string;
    maxPrice: string;
    minRating: number;
  };
  onFilterChange: (newFilters: ApiPayload) => void;
  onClear: () => void;
}

export function ServiceFilterSidebar({
  categories,
  currentFilters,
  onFilterChange,
  onClear,
}: ServiceFilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState(currentFilters);
  const [sliderValue, setSliderValue] = useState([0, 10000000]);
  const activeFilterCount =
    localFilters.categoryIds.length +
    (localFilters.minPrice ? 1 : 0) +
    (localFilters.maxPrice ? 1 : 0) +
    (localFilters.minRating > 0 ? 1 : 0);

  useEffect(() => {
    setLocalFilters(currentFilters);
    setSliderValue([
      currentFilters.minPrice ? parseInt(currentFilters.minPrice) : 0,
      currentFilters.maxPrice ? parseInt(currentFilters.maxPrice) : 10000000
    ]);
  }, [currentFilters]);

  const handlePriceChange = (type: 'min' | 'max', value: string) => {
    const val = value === '' ? '' : value;
    setLocalFilters((prev) => ({ ...prev, [type === 'min' ? 'minPrice' : 'maxPrice']: val }));
    if (val !== '') {
      const numVal = parseInt(val);
      setSliderValue(prev => type === 'min' ? [numVal, prev[1]] : [prev[0], numVal]);
    }
  };

  const handleSliderChange = (vals: number[]) => {
    setSliderValue(vals);
    setLocalFilters(prev => ({ ...prev, minPrice: vals[0].toString(), maxPrice: vals[1].toString() }));
  };

  const handleCategoryToggle = (id: string) => {
    const idStr = id.toString();
    setLocalFilters((prev) => {
      const isSelected = prev.categoryIds.includes(idStr);
      const newIds = isSelected ? prev.categoryIds.filter(cid => cid !== idStr) : [...prev.categoryIds, idStr];
      return { ...prev, categoryIds: newIds };
    });
  };

  const handleRatingChange = (rating: number) => {
    setLocalFilters((prev) => ({ ...prev, minRating: prev.minRating === rating ? 0 : rating }));
  };

  return (
    <aside className="max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain scroll-smooth [scrollbar-gutter:stable] space-y-6 bg-transparent p-5 text-white">
      <div>
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-300" />
            <h2 className="font-bold text-base text-white">Bộ lọc</h2>
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </div>
          <Button 
            variant="ghost" size="sm" onClick={onClear} aria-label="Xóa tất cả bộ lọc"
            className="h-8 px-2 text-xs text-slate-400 hover:bg-white/10 hover:text-cyan-300"
          >
            Xóa tất cả
          </Button>
        </div>

        <CategoryFilter 
          categories={categories} 
          selectedIds={localFilters.categoryIds} 
          onToggle={handleCategoryToggle} 
        />

        <PriceFilter 
          sliderValue={sliderValue} 
          minPrice={localFilters.minPrice} 
          maxPrice={localFilters.maxPrice}
          onSliderChange={handleSliderChange}
          onPriceChange={handlePriceChange}
        />

        <RatingFilter 
          minRating={localFilters.minRating} 
          onRatingChange={handleRatingChange} 
        />

        <Button 
          onClick={() => onFilterChange(localFilters)}
          className="sticky bottom-0 w-full rounded-lg border border-sky-400/20 bg-sky-600 py-6 font-bold text-white shadow-[0_0_18px_rgba(2,132,199,0.35)] transition-[background-color,box-shadow,transform] hover:bg-cyan-500 active:scale-[0.98]"
        >
          Áp dụng bộ lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>
      </div>
    </aside>
  );
}
