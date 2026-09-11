'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface ServicePricingEstimateCardProps {
  estimateLow: number;
  estimateHigh: number;
  formatPrice: (price: number) => string;
}

export function ServicePricingEstimateCard({
  estimateLow,
  estimateHigh,
  formatPrice,
}: ServicePricingEstimateCardProps) {
  return (
    <Card className="glass-panel rounded-[20px] border-white/10 text-white shadow-[var(--brand-shadow-card)] py-0 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-teal-500/5 to-transparent z-0" />
      <CardContent className="relative z-10 p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-lg border border-white/10 bg-white/10 p-1.5">
            <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            Ước tính giá
          </span>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-tight text-white/60">
              Giá dự kiến trung bình
            </p>
            <p className="mt-1 text-xl font-bold text-white sm:text-2xl">
              {formatPrice(estimateLow)} - {formatPrice(estimateHigh)}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-tight text-white/60">
              Độ tin cậy
            </p>
            <div className="mt-1 flex items-center gap-2 sm:justify-end">
              <span className="text-xs font-bold sm:text-sm">Cao (89%)</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 w-1 rounded-full bg-emerald-400" />
                ))}
                <div className="h-4 w-1 rounded-full bg-white/20" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

