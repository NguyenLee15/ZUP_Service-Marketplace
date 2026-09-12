'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, Clock, CheckCircle2, Award, Star } from 'lucide-react';
import { ProviderStats } from '../../hooks/useServiceDetailFlow';

interface ServiceProviderStatsCardProps {
  providerStats: ProviderStats | null;
  avgRating: number;
}

export function ServiceProviderStatsCard({
  providerStats,
  avgRating,
}: ServiceProviderStatsCardProps) {
  return (
    <Card className="overflow-hidden rounded-2xl mb-8 py-0 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <CardContent className="p-4 sm:p-6 text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <div className="p-1.5 rounded-lg bg-slate-50 text-sky-600 dark:bg-slate-800/60 dark:text-sky-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Thống kê nhà cung cấp
          </h3>
        </div>

        {providerStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50 text-center dark:border-slate-700/60 dark:bg-slate-800/60">
              <div className="flex justify-center mb-1 sm:mb-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-sky-600 dark:text-sky-400">
                {providerStats.avgResponseHours !== null
                  ? `~${providerStats.avgResponseHours}h`
                  : 'N/A'}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">
                Phản hồi TB
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-xl border border-emerald-200/60 bg-emerald-50 text-center dark:border-emerald-800/40 dark:bg-emerald-950/30">
              <div className="flex justify-center mb-1 sm:mb-2">
                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-700 dark:text-emerald-400" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {providerStats.completionRate !== null
                  ? `${providerStats.completionRate}%`
                  : 'N/A'}
              </p>
              <p className="text-[10px] sm:text-xs text-emerald-700 font-medium mt-1 dark:text-emerald-400">
                Hoàn thành
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-xl border border-slate-200/80 bg-slate-50 text-center dark:border-slate-700/60 dark:bg-slate-800/60">
              <div className="flex justify-center mb-1 sm:mb-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-sky-600 dark:text-sky-400" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-sky-600 dark:text-sky-400">
                {providerStats.totalCompleted}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">
                Đơn hoàn thành
              </p>
            </div>

            <div className="p-3 sm:p-4 rounded-xl border border-amber-200/60 bg-amber-50 text-center dark:border-amber-800/40 dark:bg-amber-950/30">
              <div className="flex justify-center mb-1 sm:mb-2">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-700 text-amber-700 dark:fill-amber-400 dark:text-amber-400" />
              </div>
              <p className="text-lg sm:text-2xl font-bold text-amber-700 dark:text-amber-400">
                {Number(avgRating || 0).toFixed(1)}
              </p>
              <p className="text-[10px] sm:text-xs text-amber-700 font-medium mt-1 dark:text-amber-400">
                Đánh giá TB
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-pale-gray/50 border border-platinum-tint text-center animate-pulse"
              >
                <div className="w-5 h-5 bg-platinum-tint rounded mx-auto mb-2" />
                <div className="w-12 h-6 bg-platinum-tint rounded mx-auto mb-1" />
                <div className="w-16 h-3 bg-platinum-tint rounded mx-auto" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

