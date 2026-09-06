'use client';

import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ServicesFloatingFilterButtonProps {
  showFloatingFilter: boolean;
  setIsMobileFilterOpen: (open: boolean) => void;
  activeFilterCount: number;
}

export function ServicesFloatingFilterButton({
  showFloatingFilter,
  setIsMobileFilterOpen,
  activeFilterCount,
}: ServicesFloatingFilterButtonProps) {
  return (
    <div
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 lg:hidden transition-[opacity,transform] duration-300 transform ${
        showFloatingFilter ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <Button
        onClick={() => setIsMobileFilterOpen(true)}
        className="rounded-full bg-action-blue hover:bg-glacier-blue text-white font-bold h-14 px-8 shadow-[var(--brand-shadow-button)] flex items-center gap-3 border-2 border-white/40 backdrop-blur-md"
      >
        <Filter className="w-5 h-5" />
        <span>Lọc dịch vụ</span>
        <Badge className="bg-white text-action-blue border-0 h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
          {activeFilterCount}
        </Badge>
      </Button>
    </div>
  );
}

