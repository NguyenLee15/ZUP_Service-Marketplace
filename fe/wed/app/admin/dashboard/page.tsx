"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  DollarSign,
  Download,
  FileText,
  Package,
  RefreshCw,
  Table,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { adminApi } from "@/features/auth/services/api";
import { toast } from "sonner";
import {
  AdminDashboardCard,
  AdminMetricCard,
  DashboardErrorState,
  DashboardLoadingState,
} from "../_components/AdminDashboardPrimitives";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type DashboardStats = {
  totalBookings?: number;
  totalUsers?: number;
  totalProviders?: number;
  totalServices?: number;
  activeBookings?: number;
  totalRevenue?: number;
  commissionRevenue?: number;
  avgOrderValue?: number;
};

type RevenueDataPoint = {
  month: string;
  commission: number;
};

type StatusDataPoint = {
  status: string;
  count: number;
  fill?: string;
};

type DashboardChartData = {
  revenueData?: RevenueDataPoint[];
  statusData?: StatusDataPoint[];
  categoryData?: Array<{ name: string; count: number }>;
  serviceData?: Array<{ name: string; count: number }>;
};

type DashboardFilters = {
  range: "day" | "month" | "year" | "all";
  from: string;
  to: string;
  status: string;
  providerId: string;
  categoryId: string;
  serviceId: string;
};

const defaultFilters: DashboardFilters = {
  range: "month",
  from: "",
  to: "",
  status: "",
  providerId: "",
  categoryId: "",
  serviceId: "",
};

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildDashboardParams(filters: DashboardFilters) {
  const today = new Date();
  const params: Record<string, string> = {};

  if (filters.range === "day") {
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    params.groupBy = "day";
  } else if (filters.range === "month") {
    params.from = toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1));
    params.to = toIsoDate(today);
    params.groupBy = "day";
  } else if (filters.range === "year") {
    params.from = toIsoDate(new Date(today.getFullYear(), 0, 1));
    params.to = toIsoDate(today);
    params.groupBy = "month";
  } else {
    params.groupBy = "month";
  }

  if (filters.status) params.status = filters.status;
  if (filters.providerId) params.providerId = filters.providerId;
  if (filters.categoryId) params.categoryId = filters.categoryId;
  if (filters.serviceId) params.serviceId = filters.serviceId;
  return params;
}

function compactFilters(filters: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== ""),
  );
}

function reportSummary(filters: DashboardFilters) {
  const rangeLabels = {
    day: "Theo ngày",
    month: "Tháng này",
    year: "Năm nay",
    all: "Tất cả dữ liệu",
  };
  const groupLabels = {
    day: "ngày",
    week: "tuần",
    month: "tháng",
  };
  const params = buildDashboardParams(filters);
  const parts = [rangeLabels[filters.range]];
  if (filters.range === "day" && (filters.from || filters.to)) {
    parts.push(`từ ${filters.from || "đầu kỳ"} đến ${filters.to || "hiện tại"}`);
  }
  parts.push(`nhóm theo ${groupLabels[params.groupBy as keyof typeof groupLabels]}`);
  return parts.join(", ");
}

export default function AdminDashboard() {
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<DashboardChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const fetchStats = useCallback(() => {
    const params = compactFilters(buildDashboardParams(filters));
    setLoading(true);
    setLoadError("");
    Promise.all([
      adminApi.getDashboardStats(params),
      adminApi.getDashboardChartData(params),
    ])
      .then(([statsRes, chartRes]) => {
        setStats(statsRes.data.data);
        setChartData(chartRes.data.data);
      })
      .catch(() => {
        setLoadError(
          "Không thể tải dữ liệu dashboard. Vui lòng kiểm tra kết nối và thử lại.",
        );
        toast.error("Không thể tải dữ liệu dashboard", {
          description: "Vui lòng thử lại sau.",
        });
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleExport = async (type: "pdf" | "excel") => {
    setIsExporting(true);
    try {
      const res =
        type === "pdf"
          ? await adminApi.exportDashboardPdf(compactFilters(buildDashboardParams(filters)))
          : await adminApi.exportDashboardExcel(compactFilters(buildDashboardParams(filters)));
      const mimeType =
        type === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const extension = type === "pdf" ? "pdf" : "xlsx";

      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-report-${filters.range}.${extension}`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      toast.success(`Xuất báo cáo ${type.toUpperCase()} thành công`);
    } catch {
      toast.error(`Không thể xuất ${type.toUpperCase()}`, {
        description: "Vui lòng kiểm tra lại kết nối hệ thống.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const metrics = [
    {
      label: "Doanh thu theo lọc",
      value: `${Math.round(stats?.totalRevenue || 0).toLocaleString("vi-VN")}₫`,
      icon: DollarSign,
      accent: "blue" as const,
    },
    {
      label: "Người dùng hoạt động",
      value: (stats?.totalUsers || 0) + (stats?.totalProviders || 0),
      icon: Users,
      accent: "slate" as const,
    },
    {
      label: "Dịch vụ đang cung cấp",
      value: stats?.totalServices || 0,
      icon: Package,
      accent: "green" as const,
    },
    {
      label: "Hoa hồng ước tính",
      value: `${Math.round(stats?.commissionRevenue || 0).toLocaleString("vi-VN")}₫`,
      icon: TrendingUp,
      accent: "amber" as const,
    },
  ];

  const revenueData = chartData?.revenueData || [];
  const statusData = chartData?.statusData || [];
  const categoryData = chartData?.categoryData || [];
  const serviceData = chartData?.serviceData || [];
  const formattedToday = new Intl.DateTimeFormat("vi-VN").format(new Date());
  const setFilter = (key: keyof DashboardFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  const currentReportSummary = reportSummary(filters);

  return (
    <div className="mx-auto max-w-[1600px] space-y-7 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-midnight-indigo dark:text-white">
            Tổng quan
          </h3>
          <p
            className="mt-1 text-sm text-slate-blue dark:text-gray-400"
            suppressHydrationWarning
          >
            Cập nhật ngày {formattedToday}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={fetchStats}
            variant="outline"
            size="icon"
            className="rounded-lg border-platinum-tint bg-white text-slate-blue transition-colors hover:bg-pale-gray dark:border-gray-800 dark:bg-gray-900"
            aria-label="Làm mới dữ liệu dashboard"
          >
            <RefreshCw
              className={`size-4 ${loading ? "animate-spin text-action-blue" : ""}`}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={isExporting}
                className="gap-2 rounded-lg border-platinum-tint bg-white text-midnight-indigo shadow-[var(--brand-shadow-sm)] transition-colors hover:bg-pale-gray dark:border-gray-800 dark:bg-gray-900 dark:text-white"
              >
                <Download className="size-4" />
                <span>Xuất báo cáo</span>
                <ChevronDown className="size-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-lg">
              <DropdownMenuItem
                onClick={() => handleExport("pdf")}
                className="cursor-pointer gap-2"
              >
                <FileText className="size-4 text-red-500" />
                Xuất file PDF
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("excel")}
                className="cursor-pointer gap-2"
              >
                <Table className="size-4 text-emerald-600" />
                Xuất file Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {loadError && (
        <DashboardErrorState message={loadError} onRetry={fetchStats} />
      )}

      <AdminDashboardCard
        title="Bộ lọc báo cáo"
        action={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setFilters(defaultFilters)}
            className="text-slate-blue hover:text-action-blue"
          >
            Đặt lại
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { value: "day", label: "Theo ngày" },
            { value: "month", label: "Tháng này" },
            { value: "year", label: "Năm nay" },
            { value: "all", label: "Tất cả" },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter("range", option.value)}
              className={`h-10 rounded-lg border px-4 text-sm font-semibold transition-colors ${
                filters.range === option.value
                  ? "border-action-blue bg-action-blue text-white"
                  : "border-platinum-tint bg-white text-slate-blue hover:border-action-blue hover:text-action-blue"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {filters.range === "day" && (
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="space-y-1 text-xs font-medium text-slate-blue">
              Từ ngày
              <div className="flex h-11 items-center gap-2 rounded-lg border border-platinum-tint bg-white px-3">
                <CalendarDays className="size-4 text-action-blue" />
                <input
                  type="date"
                  value={filters.from}
                  onChange={(event) => setFilter("from", event.target.value)}
                  className="w-full bg-transparent text-sm text-midnight-indigo outline-none"
                />
              </div>
            </label>
            <label className="space-y-1 text-xs font-medium text-slate-blue">
              Đến ngày
              <div className="flex h-11 items-center gap-2 rounded-lg border border-platinum-tint bg-white px-3">
                <CalendarDays className="size-4 text-action-blue" />
                <input
                  type="date"
                  value={filters.to}
                  onChange={(event) => setFilter("to", event.target.value)}
                  className="w-full bg-transparent text-sm text-midnight-indigo outline-none"
                />
              </div>
            </label>
          </div>
        )}

        <p className="mt-3 text-xs text-slate-blue">
          Báo cáo hiện tại: {currentReportSummary}
        </p>
      </AdminDashboardCard>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminDashboardCard
          title="Hoa hồng theo thời gian"
          className="lg:col-span-2"
          contentClassName="px-4 pb-5 pt-4"
        >
          {loading ? (
            <DashboardLoadingState label="Đang tải biểu đồ…" />
          ) : revenueData.length > 0 ? (
            <LineChartCard
              data={revenueData.map((item) => ({
                name: item.month,
                count: item.commission,
              }))}
              valueFormatter={(value) => `${Math.round(value).toLocaleString("vi-VN")}₫`}
            />
          ) : (
            <ChartEmptyState label="Chưa có dữ liệu hoa hồng." />
          )}
        </AdminDashboardCard>

        <AdminDashboardCard
          title="Trạng thái đơn hàng"
          contentClassName="px-4 pb-5 pt-4"
        >
          {loading ? (
            <DashboardLoadingState />
          ) : statusData.length > 0 ? (
            <RankedBarChart
              data={statusData.map((item) => ({
                name: item.status,
                count: item.count,
              }))}
              barClassName="bg-amber-500"
            />
          ) : (
            <ChartEmptyState label="Chưa có dữ liệu trạng thái." />
          )}
        </AdminDashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminDashboardCard
          title="Đơn hàng theo danh mục"
          contentClassName="px-4 pb-5 pt-4"
        >
          {loading ? (
            <DashboardLoadingState />
          ) : categoryData.length > 0 ? (
            <RankedBarChart data={categoryData} barClassName="bg-action-blue" />
          ) : (
            <ChartEmptyState label="Chưa có đơn hàng theo danh mục." />
          )}
        </AdminDashboardCard>

        <AdminDashboardCard
          title="Dịch vụ có nhiều đơn"
          contentClassName="px-4 pb-5 pt-4"
        >
          {loading ? (
            <DashboardLoadingState />
          ) : serviceData.length > 0 ? (
            <RankedBarChart data={serviceData} barClassName="bg-emerald-500" />
          ) : (
            <ChartEmptyState label="Chưa có dữ liệu dịch vụ." />
          )}
        </AdminDashboardCard>
      </div>
    </div>
  );
}

function ChartEmptyState({ label }: { label: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-lg bg-pale-gray/70 text-center text-sm font-medium text-slate-blue">
      <div className="flex flex-col items-center gap-2 px-4">
        <Package className="size-6 text-action-blue" />
        <span>{label}</span>
      </div>
    </div>
  );
}

function RankedBarChart({
  data,
  barClassName,
  valueFormatter = (value) => value.toLocaleString("vi-VN"),
}: {
  data: Array<{ name: string; count: number }>;
  barClassName: string;
  valueFormatter?: (value: number) => string;
}) {
  const visibleData = data.slice(0, 7);
  let color = "#006BFF"; // action-blue
  if (barClassName.includes("amber")) color = "#f59e0b";
  else if (barClassName.includes("emerald")) color = "#10b981";

  return (
    <div className="min-h-[280px] rounded-lg bg-pale-gray/30 p-2">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visibleData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E7EDF6" />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 12, fill: "#334155", fontWeight: 600 }} 
              width={160}
            />
            <RechartsTooltip 
              cursor={{ fill: "rgba(0,0,0,0.02)" }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl z-50 relative">
                      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
                      <p className="text-sm font-bold" style={{ color }}>
                        {valueFormatter(payload[0].value as number)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={24} label={{ position: 'right', fill: '#64748b', fontSize: 11, formatter: (val: any) => valueFormatter(val) }}>
              {visibleData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={color} fillOpacity={Math.max(0.4, 1 - (index * 0.1))} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function LineChartCard({
  data,
  valueFormatter,
}: {
  data: Array<{ name: string; count: number }>;
  valueFormatter: (value: number) => string;
}) {
  const visibleData = data.slice(-12);
  const total = visibleData.reduce((sum, item) => sum + (Number(item.count) || 0), 0);

  return (
    <div className="min-h-[280px] rounded-lg bg-pale-gray/30 p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-slate-blue">Tổng hoa hồng trong kỳ</p>
          <p className="mt-1 font-mono text-2xl font-bold text-midnight-indigo">
            {valueFormatter(total)}
          </p>
        </div>
        <p className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-slate-blue shadow-[0_1px_0_rgba(15,23,42,0.04)]">
          {visibleData.length} mốc dữ liệu
        </p>
      </div>
      <div className="h-[230px] w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#006BFF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#006BFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7EDF6" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#64748b" }} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: "#64748b" }} 
              tickFormatter={(val) => {
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                return val;
              }}
              width={50}
            />
            <RechartsTooltip 
              cursor={{ stroke: '#006BFF', strokeWidth: 1, strokeDasharray: '4 4' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl z-50 relative">
                      <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
                      <p className="text-sm font-bold text-[#006BFF]">
                        {valueFormatter(payload[0].value as number)}
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
              fill="url(#colorCount)" 
              activeDot={{ r: 6, strokeWidth: 0, fill: "#006BFF" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
