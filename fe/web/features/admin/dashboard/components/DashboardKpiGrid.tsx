'use client';

import React from 'react';
import { DollarSign, Users, Package, TrendingUp } from 'lucide-react';
import { AdminMetricCard } from '@/app/admin/_components/AdminDashboardPrimitives';
import { DashboardStats } from '../types/admin-dashboard.types';

interface DashboardKpiGridProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export function DashboardKpiGrid({ stats, loading }: DashboardKpiGridProps) {
  const metrics = [
    {
      label: 'Doanh thu theo lọc',
      value: `${Math.round(stats?.totalRevenue || 0).toLocaleString('vi-VN')}₫`,
      icon: DollarSign,
      accent: 'blue' as const,
    },
    {
      label: 'Người dùng hoạt động',
      value: (stats?.totalUsers || 0) + (stats?.totalProviders || 0),
      icon: Users,
      accent: 'slate' as const,
    },
    {
      label: 'Dịch vụ đang cung cấp',
      value: stats?.totalServices || 0,
      icon: Package,
      accent: 'green' as const,
    },
    {
      label: 'Hoa hồng ước tính',
      value: `${Math.round(stats?.commissionRevenue || 0).toLocaleString('vi-VN')}₫`,
      icon: TrendingUp,
      accent: 'amber' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <AdminMetricCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          icon={metric.icon}
          accent={metric.accent}
          loading={loading}
        />
      ))}
    </div>
  );
}

