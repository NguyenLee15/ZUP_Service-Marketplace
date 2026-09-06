import { DashboardFilters } from '../types/admin-dashboard.types';

export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildDashboardParams(filters: DashboardFilters): Record<string, string> {
  const today = new Date();
  const params: Record<string, string> = {};

  if (filters.range === 'day') {
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    params.groupBy = 'day';
  } else if (filters.range === 'month') {
    params.from = toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1));
    params.to = toIsoDate(today);
    params.groupBy = 'day';
  } else if (filters.range === 'year') {
    params.from = toIsoDate(new Date(today.getFullYear(), 0, 1));
    params.to = toIsoDate(today);
    params.groupBy = 'month';
  } else {
    params.groupBy = 'month';
  }

  if (filters.status) params.status = filters.status;
  if (filters.providerId) params.providerId = filters.providerId;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.serviceId) params.serviceId = filters.serviceId;

  return params;
}

export function compactFilters(filters: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== '')
  );
}

export function reportSummary(filters: DashboardFilters): string {
  const rangeLabels: Record<string, string> = {
    day: 'Theo ngày',
    month: 'Tháng này',
    year: 'Năm nay',
    all: 'Tất cả dữ liệu',
  };
  const groupLabels: Record<string, string> = {
    day: 'ngày',
    week: 'tuần',
    month: 'tháng',
  };
  const params = buildDashboardParams(filters);
  const parts = [rangeLabels[filters.range] || ''];
  if (filters.range === 'day' && (filters.from || filters.to)) {
    parts.push(`từ ${filters.from || 'đầu kỳ'} đến ${filters.to || 'hiện tại'}`);
  }
  parts.push(`nhóm theo ${groupLabels[params.groupBy as keyof typeof groupLabels] || 'thời gian'}`);
  return parts.join(', ');
}

