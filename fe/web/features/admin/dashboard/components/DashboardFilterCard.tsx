'use client';

import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminDashboardCard } from '@/app/admin/_components/AdminDashboardPrimitives';
import {
  DashboardFilters,
} from '../types/admin-dashboard.types';

interface DashboardFilterCardProps {
  filters: DashboardFilters;
  reportSummary: string;
  onFilterChange: (key: keyof DashboardFilters, value: string) => void;
  onReset: () => void;
}

const RANGE_OPTIONS: Array<{ value: DashboardFilters['range']; label: string }> = [
  { value: 'day', label: 'Theo ngày' },
  { value: 'month', label: 'Tháng này' },
  { value: 'year', label: 'Năm nay' },
  { value: 'all', label: 'Tất cả' },
];

export function DashboardFilterCard({
  filters,
  reportSummary,
  onFilterChange,
  onReset,
}: DashboardFilterCardProps) {
  return (
    <AdminDashboardCard
      title="Bộ lọc báo cáo"
      action={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-slate-blue hover:text-action-blue"
        >
          Đặt lại
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onFilterChange('range', option.value)}
            className={`h-10 rounded-lg border px-4 text-sm font-semibold transition-colors ${
              filters.range === option.value
                ? 'border-action-blue bg-action-blue text-white'
                : 'border-platinum-tint bg-white text-slate-blue hover:border-action-blue hover:text-action-blue'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {filters.range === 'day' && (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-slate-blue">
            Từ ngày
            <div className="flex h-11 items-center gap-2 rounded-lg border border-platinum-tint bg-white px-3">
              <CalendarDays className="h-4 w-4 text-action-blue" />
              <input
                type="date"
                value={filters.from}
                onChange={(e) => onFilterChange('from', e.target.value)}
                className="w-full bg-transparent text-sm text-midnight-indigo outline-none"
              />
            </div>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-blue">
            Đến ngày
            <div className="flex h-11 items-center gap-2 rounded-lg border border-platinum-tint bg-white px-3">
              <CalendarDays className="h-4 w-4 text-action-blue" />
              <input
                type="date"
                value={filters.to}
                onChange={(e) => onFilterChange('to', e.target.value)}
                className="w-full bg-transparent text-sm text-midnight-indigo outline-none"
              />
            </div>
          </label>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-blue">
        Báo cáo hiện tại: {reportSummary}
      </p>
    </AdminDashboardCard>
  );
}

