'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface ServiceStickyFooterProps {
  referencePrice: number;
  formatPrice: (price: number) => string;
  onBookNow: () => void;
}

export function ServiceStickyFooter({
  referencePrice,
  formatPrice,
  onBookNow,
}: ServiceStickyFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/90 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 sm:p-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Giá từ
          </p>
          <p className="text-lg font-extrabold text-sky-600 tabular-nums dark:text-sky-400 sm:text-2xl">
            {formatPrice(referencePrice)}
          </p>
        </div>
        <Button
          onClick={onBookNow}
          className="h-10 shrink-0 rounded-xl bg-sky-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow active:scale-95 sm:h-11 sm:px-7 sm:text-base"
        >
          <Calendar className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" /> Đặt lịch
        </Button>
      </div>
    </div>
  );
}

