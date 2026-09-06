'use client';

import React from 'react';
import { Package } from 'lucide-react';

interface ChartEmptyStateProps {
  label: string;
}

export function ChartEmptyState({ label }: ChartEmptyStateProps) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-lg bg-pale-gray/70 text-center text-sm font-medium text-slate-blue">
      <div className="flex flex-col items-center gap-2 px-4">
        <Package className="h-6 w-6 text-action-blue" />
        <span>{label}</span>
      </div>
    </div>
  );
}

