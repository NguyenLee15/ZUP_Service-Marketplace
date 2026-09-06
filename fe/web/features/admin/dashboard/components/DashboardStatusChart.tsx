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
import { StatusDataPoint } from '../types/admin-dashboard.types';

interface DashboardStatusChartProps {
  data: StatusDataPoint[];
  loading: boolean;
}

export function DashboardStatusChart({ data, loading }: DashboardStatusChartProps) {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const visibleData = data.slice(0, 7).map((item) => ({
    name: item.status,
    count: item.count,
  }));

  const color = '#f59e0b'; // amber-500

  return (
    <AdminDashboardCard
      title="Trạng thái đơn hàng"
      contentClassName="px-4 pb-5 pt-4"
    >
      {!isMounted || loading ? (
        <DashboardLoadingState />
      ) : visibleData.length > 0 ? (
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
                  width={140}
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
                          <p className="text-sm font-bold text-amber-600">
                            {(payload[0].value as number).toLocaleString('vi-VN')}{' '}
                            đơn
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
      ) : (
        <ChartEmptyState label="Chưa có dữ liệu trạng thái." />
      )}
    </AdminDashboardCard>
  );
}

