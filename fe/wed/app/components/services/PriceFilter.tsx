'use client';

import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

interface PriceFilterProps {
  sliderValue: number[];
  minPrice: string;
  maxPrice: string;
  onSliderChange: (vals: number[]) => void;
  onPriceChange: (type: 'min' | 'max', value: string) => void;
}

export function PriceFilter({ sliderValue, minPrice, maxPrice, onSliderChange, onPriceChange }: PriceFilterProps) {
  return (
    <div className="space-y-6 mb-8">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Khoảng giá (VNĐ)</h3>
      <div className="px-2">
        <Slider 
          min={0} max={10000000} step={100000}
          value={sliderValue}
          onValueChange={onSliderChange}
          className="mb-6"
        />
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">TỪ</span>
            <Input 
              type="number" placeholder="0" 
              name="minPrice"
              aria-label="Giá tối thiểu"
              autoComplete="off"
              value={minPrice} onChange={(e) => onPriceChange('min', e.target.value)}
              className="h-10 border-white/10 bg-white/[0.06] pl-10 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:ring-cyan-300/20" 
            />
          </div>
          <span className="text-slate-500">—</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">ĐẾN</span>
            <Input 
              type="number" placeholder="Đến" 
              name="maxPrice"
              aria-label="Giá tối đa"
              autoComplete="off"
              value={maxPrice} onChange={(e) => onPriceChange('max', e.target.value)}
              className="h-10 border-white/10 bg-white/[0.06] pl-10 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300 focus:ring-cyan-300/20" 
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['500000', '1000000', '5000000'].map(p => (
            <button
              key={p}
              type="button"
              className="inline-flex items-center rounded-full border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300 shadow-sm transition-colors hover:bg-cyan-300/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              onClick={() => onPriceChange('max', p)}
            >
              &lt; {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumSignificantDigits: 3 }).format(parseInt(p))}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
