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
    <Card className="rounded-xl border border-border bg-card shadow-sm py-0 relative overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="rounded-lg border border-border bg-sky-50 dark:bg-sky-950/40 p-1.5 text-sky-600 dark:text-sky-400">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Khoảng giá tham khảo
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs text-muted-foreground">
              Mức giá ước tính theo thị trường
            </p>
            <p className="mt-1 text-xl font-extrabold text-sky-600 dark:text-sky-400 sm:text-2xl tabular-nums">
              {formatPrice(estimateLow)} - {formatPrice(estimateHigh)}
            </p>
          </div>

          <div className="text-xs text-muted-foreground sm:text-right max-w-xs">
            <p className="leading-relaxed">
              * Báo giá chính xác sẽ được thợ xác nhận minh bạch sau khi kiểm tra thực tế tại nhà.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

