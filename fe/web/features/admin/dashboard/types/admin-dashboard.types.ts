export interface DashboardStats {
  totalBookings?: number;
  totalUsers?: number;
  totalProviders?: number;
  totalServices?: number;
  activeBookings?: number;
  totalRevenue?: number;
  commissionRevenue?: number;
  avgOrderValue?: number;
}

export interface RevenueDataPoint {
  month: string;
  commission: number;
}

export interface StatusDataPoint {
  status: string;
  count: number;
  fill?: string;
}

export interface RankedCountItem {
  name: string;
  count: number;
}

export interface DashboardChartData {
  revenueData?: RevenueDataPoint[];
  statusData?: StatusDataPoint[];
  categoryData?: RankedCountItem[];
  serviceData?: RankedCountItem[];
}

export interface DashboardFilters {
  range: 'day' | 'month' | 'year' | 'all';
  from: string;
  to: string;
  status: string;
  providerId: string;
  categoryId: string;
  serviceId: string;
}

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilters = {
  range: 'all',
  from: '',
  to: '',
  status: '',
  providerId: '',
  categoryId: '',
  serviceId: '',
};

