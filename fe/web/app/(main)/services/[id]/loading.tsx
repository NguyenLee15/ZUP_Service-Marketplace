import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ServiceDetailLoading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-44 space-y-6">
      {/* Back button */}
      <Skeleton className="h-9 w-24 rounded-lg" />

      {/* Image Gallery */}
      <Skeleton className="aspect-[16/9] w-full rounded-[20px]" />

      {/* Title & Price */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-8 w-3/4 rounded-lg" />
          </div>
          <div className="text-right shrink-0 space-y-2">
            <Skeleton className="h-4 w-16 ml-auto rounded" />
            <Skeleton className="h-8 w-32 ml-auto rounded-lg" />
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-12 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>

        {/* Pricing Estimate Card */}
        <Skeleton className="h-28 w-full rounded-[20px]" />

        {/* Description */}
        <div className="space-y-2 py-4">
          <Skeleton className="h-6 w-36 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-5/6 rounded" />
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>

        {/* Provider Card */}
        <div className="surface-card rounded-[20px] p-4 flex items-center justify-between shadow-[var(--brand-shadow-card)]">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-36 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        {/* Stats Card */}
        <div className="surface-card rounded-[20px] p-6 shadow-[var(--brand-shadow-card)] space-y-4">
          <Skeleton className="h-6 w-48 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

