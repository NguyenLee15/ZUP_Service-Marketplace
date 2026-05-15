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
  onFilterChange: (newFilters: any) => void;
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
    <aside className="surface-card max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain scroll-smooth [scrollbar-gutter:stable] space-y-8 p-6 rounded-[20px] lg:sticky lg:top-24 transition-[box-shadow,border-color] duration-300 hover:border-action-blue/20">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-action-blue" />
            <h2 className="font-bold text-lg text-midnight-indigo">Bộ lọc tìm kiếm</h2>
            {activeFilterCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-action-blue text-white text-[11px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>
          <Button 
            variant="ghost" size="sm" onClick={onClear} aria-label="Xóa tất cả bộ lọc"
            className="text-xs text-muted-foreground hover:text-action-blue px-2 h-8"
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
          className="sticky bottom-0 w-full bg-action-blue hover:bg-glacier-blue text-white font-bold py-6 rounded-lg shadow-[var(--brand-shadow-button)] transition-[background-color,box-shadow,transform] active:scale-[0.98]"
        >
          Áp dụng bộ lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </Button>
      </div>
    </aside>
  );
}
