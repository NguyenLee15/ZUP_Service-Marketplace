import React from 'react';

export function ServicesListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="surface-card p-4 rounded-[20px] space-y-4 animate-pulse">
          <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CategoryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 py-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="surface-card p-4 rounded-2xl flex flex-col items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-12" />
        </div>
      ))}
    </div>
  );
}
