'use client';

import { Star, X } from 'lucide-react';

interface RatingFilterProps {
  minRating: number;
  onRatingChange: (rating: number) => void;
}

export function RatingFilter({ minRating, onRatingChange }: RatingFilterProps) {
  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Đánh giá</h3>
      <div className="space-y-2">
        {[5, 4, 3].map((star) => (
          <div 
            key={star} 
            className={`flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors ${minRating === star ? 'bg-yellow-400/10' : 'hover:bg-white/8'}`}
            onClick={() => onRatingChange(star)}
          >
            <div className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${minRating === star ? 'border-yellow-400 bg-yellow-400' : 'border-slate-500'}`}>
              {minRating === star && <X className="w-3 h-3 text-white" />}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < star ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}`} />
              ))}
              {star < 5 && <span className="ml-1 text-xs text-slate-400">trở lên</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
