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
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#070d12]/88 p-3 shadow-[0_-18px_48px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-4">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#101827]/92 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
        <div className="flex-1">
          <p className="mb-1 text-[10px] font-medium leading-none text-slate-400 sm:text-xs">
            Giá từ
          </p>
          <p className="text-base font-extrabold leading-none text-cyan-300 sm:text-lg">
            {formatPrice(referencePrice)}
          </p>
        </div>
        <Button
          onClick={onBookNow}
          className="h-10 shrink-0 rounded-xl bg-[#0B7CFF] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(11,124,255,0.32)] transition-colors hover:bg-[#19B9F3] sm:h-11 sm:px-7 sm:text-base"
        >
          <Calendar className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" /> Đặt lịch
        </Button>
      </div>
    </div>
  );
}

