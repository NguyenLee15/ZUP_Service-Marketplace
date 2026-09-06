'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  AdminDashboardCard,
  DashboardLoadingState,
} from '@/app/admin/_components/AdminDashboardPrimitives';
import { ChartEmptyState } from './ChartEmptyState';
import { RankedCountItem } from '../types/admin-dashboard.types';

interface DashboardCategoryRankingsProps {
  categoryData: RankedCountItem[];
  serviceData: RankedCountItem[];
  loading: boolean;
}

function RankedHorizontalBar({
  data,
  color,
  emptyLabel,
}: {
  data: RankedCountItem[];
  color: string;
  emptyLabel: string;
}) {
  const visibleData = data.slice(0, 7);

  if (visibleData.length === 0) {
    return <ChartEmptyState label={emptyLabel} />;
  }

  return (
    <div className="min-h-[280px] rounded-lg bg-pale-gray/30 p-2">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
          <BarChart
            data={visibleData}
            layout="vertical"
            margin={{ top: 0, right: 45, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={false}
              stroke="#E7EDF6"
            />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#334155', fontWeight: 600 }}
              width={160}
            />
            <RechartsTooltip
              cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="relative z-50 rounded-xl border border-slate-100 bg-white p-3 shadow-xl">
                      <p className="mb-1 text-xs font-semibold text-slate-500">
                        {label}
                      </p>
                      <p className="text-sm font-bold" style={{ color }}>
                        {(payload[0].value as number).toLocaleString('vi-VN')} đơn
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              barSize={24}
              label={{
                position: 'right',
                fill: '#64748b',
                fontSize: 11,
                formatter: (val: number | string | readonly (string | number)[] | undefined) =>
                  val !== undefined ? Number(val).toLocaleString('vi-VN') : '',
              }}
            >
              {visibleData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={color}
                  fillOpacity={Math.max(0.4, 1 - index * 0.1)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DashboardCategoryRankings({
  categoryData,
  serviceData,
  loading,
}: DashboardCategoryRankingsProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <AdminDashboardCard
        title="Đơn hàng theo danh mục"
        contentClassName="px-4 pb-5 pt-4"
      >
        {!isMounted || loading ? (
          <DashboardLoadingState />
        ) : (
          <RankedHorizontalBar
            data={categoryData}
            color="#006BFF"
            emptyLabel="Chưa có đơn hàng theo danh mục."
          />
        )}
      </AdminDashboardCard>

      <AdminDashboardCard
        title="Dịch vụ có nhiều đơn"
        contentClassName="px-4 pb-5 pt-4"
      >
        {loading ? (
          <DashboardLoadingState />
        ) : (
          <RankedHorizontalBar
            data={serviceData}
            color="#10b981"
            emptyLabel="Chưa có dữ liệu dịch vụ."
          />
        )}
      </AdminDashboardCard>
    </div>
  );
}

