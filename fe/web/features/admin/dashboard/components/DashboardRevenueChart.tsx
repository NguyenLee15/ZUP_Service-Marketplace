'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  AdminDashboardCard,
  DashboardLoadingState,
} from '@/app/admin/_components/AdminDashboardPrimitives';
import { ChartEmptyState } from './ChartEmptyState';
import { RevenueDataPoint } from '../types/admin-dashboard.types';

interface DashboardRevenueChartProps {
  data: RevenueDataPoint[];
  loading: boolean;
}

export function DashboardRevenueChart({ data, loading }: DashboardRevenueChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const visibleData = data.slice(-12).map((item) => ({
    name: item.month,
    count: item.commission,
  }));

  const totalCommission = visibleData.reduce(
    (sum, item) => sum + (Number(item.count) || 0),
    0
  );

  const formatCurrency = (val: number) =>
    `${Math.round(val).toLocaleString('vi-VN')}₫`;

  return (
    <AdminDashboardCard
      title="Hoa hồng theo thời gian"
      className="lg:col-span-2"
      contentClassName="px-4 pb-5 pt-4"
    >
      {!isMounted || loading ? (
        <DashboardLoadingState label="Đang tải biểu đồ…" />
      ) : visibleData.length > 0 ? (
        <div className="min-h-[280px] rounded-lg bg-pale-gray/30 p-4">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-blue">
                Tổng hoa hồng trong kỳ
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-midnight-indigo">
                {formatCurrency(totalCommission)}
              </p>
            </div>
            <p className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-blue shadow-[0_1px_0_rgba(15,23,42,0.04)]">
              {visibleData.length} mốc dữ liệu
            </p>
          </div>

          <div className="mt-6 h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={230}>
              <AreaChart
                data={visibleData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006BFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#006BFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E7EDF6"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return val;
                  }}
                  width={50}
                />
                <RechartsTooltip
                  cursor={{
                    stroke: '#006BFF',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                  }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="relative z-50 rounded-xl border border-slate-100 bg-white p-3 shadow-xl">
                          <p className="mb-1 text-xs font-semibold text-slate-500">
                            {label}
                          </p>
                          <p className="text-sm font-bold text-[#006BFF]">
                            {formatCurrency(payload[0].value as number)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#006BFF"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorCommission)"
                  dot={{ r: 5, fill: '#006BFF', strokeWidth: 2, stroke: '#ffffff' }}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#006BFF' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <ChartEmptyState label="Chưa có dữ liệu hoa hồng." />
      )}
    </AdminDashboardCard>
  );
}

