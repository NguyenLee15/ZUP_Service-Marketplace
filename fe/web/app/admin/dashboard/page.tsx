'use client';

import React from 'react';
import { AdminPermissionGuard } from '@/features/admin/components/AdminPermissionGuard';
import { AdminPermission } from '@/types/admin-permissions';
import { DashboardErrorState } from '../_components/AdminDashboardPrimitives';
import { useAdminDashboardFlow } from '@/features/admin/dashboard/hooks/useAdminDashboardFlow';
import {
  DashboardHeaderActions,
  DashboardFilterCard,
  DashboardKpiGrid,
  DashboardRevenueChart,
  DashboardStatusChart,
  DashboardCategoryRankings,
} from '@/features/admin/dashboard/components';

function AdminDashboardContent() {
  const {
    stats,
    chartData,
    loading,
    loadError,
    filters,
    isExporting,
    currentReportSummary,
    fetchStats,
    setFilter,
    resetFilters,
    handleExport,
  } = useAdminDashboardFlow();

  const revenueData = chartData?.revenueData || [];
  const statusData = chartData?.statusData || [];
  const categoryData = chartData?.categoryData || [];
  const serviceData = chartData?.serviceData || [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-7 pb-10">
      <DashboardHeaderActions
        loading={loading}
        isExporting={isExporting}
        onRefresh={fetchStats}
        onExport={handleExport}
      />

      {loadError && (
        <DashboardErrorState message={loadError} onRetry={fetchStats} />
      )}

      <DashboardFilterCard
        filters={filters}
        reportSummary={currentReportSummary}
        onFilterChange={setFilter}
        onReset={resetFilters}
      />

      <DashboardKpiGrid stats={stats} loading={loading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardRevenueChart data={revenueData} loading={loading} />
        <DashboardStatusChart data={statusData} loading={loading} />
      </div>

      <DashboardCategoryRankings
        categoryData={categoryData}
        serviceData={serviceData}
        loading={loading}
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminPermissionGuard permission={AdminPermission.FINANCE_REVENUE}>
      <AdminDashboardContent />
    </AdminPermissionGuard>
  );
}
