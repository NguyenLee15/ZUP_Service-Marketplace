import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminApi } from '@/features/auth/services/api';
import { toast } from 'sonner';
import {
  DashboardStats,
  DashboardChartData,
  DashboardFilters,
  DEFAULT_DASHBOARD_FILTERS,
} from '../types/admin-dashboard.types';
import {
  buildDashboardParams,
  compactFilters,
  reportSummary,
} from '../utils/admin-dashboard-helpers';

export function useAdminDashboardFlow() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<DashboardChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_DASHBOARD_FILTERS);
  const [isExporting, setIsExporting] = useState(false);

  const fetchStats = useCallback(() => {
    const params = compactFilters(buildDashboardParams(filters));
    setLoading(true);
    setLoadError('');
    Promise.all([
      adminApi.getDashboardStats(params),
      adminApi.getDashboardChartData(params),
    ])
      .then(([statsRes, chartRes]) => {
        setStats(statsRes.data?.data || null);
        setChartData(chartRes.data?.data || null);
      })
      .catch(() => {
        setLoadError(
          'Không thể tải dữ liệu dashboard. Vui lòng kiểm tra kết nối và thử lại.'
        );
        toast.error('Không thể tải dữ liệu dashboard', {
          description: 'Vui lòng thử lại sau.',
        });
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const setFilter = (key: keyof DashboardFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_DASHBOARD_FILTERS);
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      const params = compactFilters(buildDashboardParams(filters));
      const res =
        type === 'pdf'
          ? await adminApi.exportDashboardPdf(params)
          : await adminApi.exportDashboardExcel(params);

      const mimeType =
        type === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const extension = type === 'pdf' ? 'pdf' : 'xlsx';

      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard-report-${filters.range}.${extension}`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success(`Xuất báo cáo ${type.toUpperCase()} thành công`);
    } catch {
      toast.error(`Không thể xuất ${type.toUpperCase()}`, {
        description: 'Vui lòng kiểm tra lại kết nối hệ thống.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const currentReportSummary = useMemo(() => reportSummary(filters), [filters]);

  return {
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
  };
}

