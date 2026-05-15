'use client';

import { Star, X } from 'lucide-react';

interface RatingFilterProps {
  minRating: number;
  onRatingChange: (rating: number) => void;
}

export function RatingFilter({ minRating, onRatingChange }: RatingFilterProps) {
  return (
    <div className="space-y-4 mb-8">
      <h3 className="font-bold text-xs text-muted-foreground uppercase tracking-widest">Đánh giá</h3>
      <div className="space-y-2">
        {[5, 4, 3].map((star) => (
          <div 
            key={star} 
            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${minRating === star ? 'bg-yellow-400/10' : 'hover:bg-muted'}`}
            onClick={() => onRatingChange(star)}
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${minRating === star ? 'bg-yellow-400 border-yellow-400' : 'border-muted-foreground/30'}`}>
              {minRating === star && <X className="w-3 h-3 text-white" />}
            </div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < star ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`} />
              ))}
              {star < 5 && <span className="text-xs text-muted-foreground ml-1">trở lên</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
