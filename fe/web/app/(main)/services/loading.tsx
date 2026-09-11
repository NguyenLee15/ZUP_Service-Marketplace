import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ServicesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Search Bar Skeleton */}
      <div className="surface-card rounded-2xl p-4 shadow-[var(--brand-shadow-card)] space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-11 flex-1 rounded-xl" />
          <Skeleton className="h-11 w-32 rounded-xl" />
          <Skeleton className="h-11 w-28 rounded-xl" />
        </div>
        {/* Category Chips Skeleton */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full shrink-0" />
          ))}
        </div>
      </div>

      {/* Main Grid: Sidebar + Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Skeleton (hidden on mobile) */}
        <div className="hidden lg:block space-y-4">
          <div className="surface-card rounded-2xl p-5 space-y-4 shadow-[var(--brand-shadow-card)]">
            <Skeleton className="h-6 w-32 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 rounded" />
              <div className="flex gap-2">
                <Skeleton className="h-9 flex-1 rounded-lg" />
                <Skeleton className="h-9 flex-1 rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28 rounded" />
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Cards Skeleton */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-40 rounded" />
            <Skeleton className="h-9 w-36 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="surface-card rounded-2xl overflow-hidden shadow-[var(--brand-shadow-card)] flex flex-col"
              >
                <Skeleton className="aspect-[16/10] w-full" />
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20 rounded-full" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                    <Skeleton className="h-5 w-4/5 rounded" />
                    <Skeleton className="h-4 w-3/5 rounded" />
                  </div>
                  <div className="pt-3 border-t border-platinum-tint flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-4 w-20 rounded" />
                    </div>
                    <Skeleton className="h-5 w-24 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

