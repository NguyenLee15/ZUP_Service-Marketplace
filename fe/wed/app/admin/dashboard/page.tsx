"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
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

const BarChart = dynamic(
  () => import("recharts").then((mod) => mod.BarChart as any),
  {
    ssr: false,
  },
) as any;
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar as any), {
  ssr: false,
}) as any;
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell as any), {
  ssr: false,
}) as any;
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis as any),
  {
    ssr: false,
  },
) as any;
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis as any),
  {
    ssr: false,
  },
) as any;
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid as any),
  {
    ssr: false,
  },
) as any;
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip as any),
  {
    ssr: false,
  },
) as any;
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer as any),
  { ssr: false },
) as any;
type DashboardStats = {
  totalBookings?: number;
  totalUsers?: number;
  totalProviders?: number;
  totalServices?: number;
  activeBookings?: number;
  totalRevenue?: number;
  commissionRevenue?: number;
  avgOrderValue?: number;
  filterSummary?: string;
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
  provinceData?: Array<{ name: string; count: number }>;
  categoryData?: Array<{ name: string; count: number }>;
  serviceData?: Array<{ name: string; count: number }>;
  filterOptions?: {
    providers?: Array<{ id: number; fullName: string }>;
    categories?: Array<{ id: number; name: string; level?: number; parentId?: number | null }>;
    services?: Array<{
      id: number;
      name: string;
      provider?: { fullName?: string };
      category?: { name?: string };
    }>;
  };
};

const statusColors = ["#006BFF", "#10b981", "#f59e0b", "#ef4444", "#64748b"];
const bookingStatuses = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "QUOTED", label: "Đã báo giá" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "IN_PROGRESS", label: "Đang thực hiện" },
  { value: "DONE", label: "Hoàn thành" },
  { value: "DISPUTED", label: "Khiếu nại" },
  { value: "CANCELLED", label: "Đã hủy" },
];

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
  const provinceData = chartData?.provinceData || [];
  const categoryData = chartData?.categoryData || [];
  const serviceData = chartData?.serviceData || [];
  const filterOptions = chartData?.filterOptions || {};
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

      <AdminDashboardCard
        title="Phân bố đơn hàng theo tỉnh/thành phố"
        contentClassName="px-2 pb-5 pt-3"
      >
        {loading ? (
          <DashboardLoadingState label="Đang tải phân bố địa lý…" />
        ) : provinceData.length > 0 ? (
          <SimpleBarList data={provinceData} color="bg-teal-600" />
        ) : (
          <ChartEmptyState label="Chưa có đơn hàng theo tỉnh/thành phố." />
        )}
      </AdminDashboardCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AdminDashboardCard
          title="Hoa hồng theo bộ lọc"
          className="lg:col-span-2"
          contentClassName="px-2 pb-5 pt-3"
        >
          {loading ? (
            <DashboardLoadingState label="Đang tải biểu đồ…" />
          ) : revenueData.length > 0 ? (
            <SimpleBarList
              data={revenueData.map((item) => ({
                name: item.month,
                count: item.commission,
              }))}
              color="bg-action-blue"
              valueFormatter={(value) => `${Math.round(value).toLocaleString("vi-VN")}₫`}
            />
          ) : (
            <ChartEmptyState label="Chưa có dữ liệu hoa hồng." />
          )}
        </AdminDashboardCard>

        <AdminDashboardCard
          title="Trạng thái đơn hàng"
          contentClassName="px-2 pb-5 pt-3"
        >
          {loading ? (
            <DashboardLoadingState />
          ) : statusData.length > 0 ? (
            <SimpleBarList
              data={statusData.map((item) => ({
                name: item.status,
                count: item.count,
              }))}
              color="bg-amber-500"
            />
          ) : (
            <ChartEmptyState label="Chưa có dữ liệu trạng thái." />
          )}
        </AdminDashboardCard>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminDashboardCard
          title="Đơn hàng theo danh mục"
          contentClassName="px-2 pb-5 pt-3"
        >
          {loading ? (
            <DashboardLoadingState />
          ) : categoryData.length > 0 ? (
            <SimpleBarList data={categoryData} color="bg-action-blue" />
          ) : (
            <ChartEmptyState label="Chưa có đơn hàng theo danh mục." />
          )}
        </AdminDashboardCard>

        <AdminDashboardCard
          title="Dịch vụ có nhiều đơn"
          contentClassName="px-2 pb-5 pt-3"
        >
          {loading ? (
            <DashboardLoadingState />
          ) : serviceData.length > 0 ? (
            <SimpleBarList data={serviceData} color="bg-emerald-500" />
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

function SimpleBarList({
  data,
  color,
  valueFormatter = (value) => value.toLocaleString("vi-VN"),
}: {
  data: Array<{ name: string; count: number }>;
  color: string;
  valueFormatter?: (value: number) => string;
}) {
  const maxValue = Math.max(...data.map((item) => Number(item.count) || 0), 1);

  return (
    <div className="min-h-[280px] space-y-3 p-3">
      {data.map((item) => {
        const value = Number(item.count) || 0;
        const width = Math.max((value / maxValue) * 100, value > 0 ? 8 : 0);

        return (
          <div key={item.name} className="grid grid-cols-[minmax(120px,220px)_1fr_auto] items-center gap-3">
            <p className="truncate text-sm font-medium text-midnight-indigo" title={item.name}>
              {item.name}
            </p>
            <div className="h-3 overflow-hidden rounded-full bg-pale-gray">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${width}%` }}
              />
            </div>
            <p className="min-w-16 text-right text-sm font-semibold text-midnight-indigo">
              {valueFormatter(value)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
