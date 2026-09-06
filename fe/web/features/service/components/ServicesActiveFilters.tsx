'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Category } from '@/types';

interface ServicesActiveFiltersProps {
  activeCategories: Category[];
  minPrice: string;
  maxPrice: string;
  minRating: number;
  formatPrice: (price: number) => string;
  removeFilter: (key: string, value?: string) => void;
  onClearFilters: () => void;
}

export function ServicesActiveFilters({
  activeCategories,
  minPrice,
  maxPrice,
  minRating,
  formatPrice,
  removeFilter,
  onClearFilters,
}: ServicesActiveFiltersProps) {
  const hasAnyFilter =
    activeCategories.length > 0 || Boolean(minPrice) || Boolean(maxPrice) || minRating > 0;

  if (!hasAnyFilter) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-10 empty:hidden">
      {activeCategories.map((cat) => (
        <Badge
          key={cat.id}
          variant="secondary"
          className="pl-3 pr-1 py-1.5 rounded-full bg-pale-gray text-glacier-blue border-platinum-tint gap-2 font-bold transition-colors hover:bg-platinum-tint/60"
        >
          Danh mục: {cat.name}
          <button
            type="button"
            aria-label={`Bỏ lọc ${cat.name}`}
            onClick={() => removeFilter('categoryIds', cat.id.toString())}
            className="p-0.5 hover:bg-platinum-tint rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </Badge>
      ))}

      {minPrice && (
        <Badge
          variant="secondary"
          className="pl-3 pr-1 py-1.5 rounded-full bg-pale-gray text-glacier-blue border-platinum-tint gap-2 font-bold transition-colors hover:bg-platinum-tint/60"
        >
          Từ {formatPrice(Number(minPrice))}
          <button
            type="button"
            aria-label="Bỏ lọc giá tối thiểu"
            onClick={() => removeFilter('minPrice')}
            className="p-0.5 hover:bg-platinum-tint rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </Badge>
      )}

      {maxPrice && (
        <Badge
          variant="secondary"
          className="pl-3 pr-1 py-1.5 rounded-full bg-pale-gray text-glacier-blue border-platinum-tint gap-2 font-bold transition-colors hover:bg-platinum-tint/60"
        >
          Đến {formatPrice(Number(maxPrice))}
          <button
            type="button"
            aria-label="Bỏ lọc giá tối đa"
            onClick={() => removeFilter('maxPrice')}
            className="p-0.5 hover:bg-platinum-tint rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </Badge>
      )}

      {minRating > 0 && (
        <Badge
          variant="secondary"
          className="pl-3 pr-1 py-1.5 rounded-full bg-amber-pop/15 text-midnight-indigo border-amber-pop/30 gap-2 font-bold transition-colors hover:bg-amber-pop/20"
        >
          {minRating}+ Sao
          <button
            type="button"
            aria-label="Bỏ lọc đánh giá"
            onClick={() => removeFilter('minRating')}
            className="p-0.5 hover:bg-amber-pop/20 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </Badge>
      )}

      <button
        onClick={onClearFilters}
        className="text-xs font-bold text-muted-foreground hover:text-red-500 transition-colors px-2"
      >
        Xóa tất cả
      </button>
    </div>
  );
}

