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
  from: string;
  to: string;
  groupBy: "day" | "week" | "month";
  status: string;
  providerId: string;
  categoryId: string;
  serviceId: string;
};

const defaultFilters: DashboardFilters = {
  from: "",
  to: "",
  groupBy: "month",
  status: "",
  providerId: "",
  categoryId: "",
  serviceId: "",
};

function compactFilters(filters: DashboardFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== ""),
  );
}

export default function AdminDashboard() {
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<DashboardChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const fetchStats = useCallback(() => {
    const params = compactFilters(filters);
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
          ? await adminApi.exportDashboardPdf(compactFilters(filters))
          : await adminApi.exportDashboardExcel(compactFilters(filters));
      const mimeType =
        type === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const extension = type === "pdf" ? "pdf" : "xlsx";

      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `dashboard-report-${filters.from || "all"}-${filters.to || formattedToday}.${extension}`;
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
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
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
          <label className="space-y-1 text-xs font-medium text-slate-blue">
            Nhóm
            <select
              value={filters.groupBy}
              onChange={(event) => setFilter("groupBy", event.target.value)}
              className="h-11 w-full rounded-lg border border-platinum-tint bg-white px-3 text-sm text-midnight-indigo outline-none"
            >
              <option value="day">Theo ngày</option>
              <option value="week">Theo tuần</option>
              <option value="month">Theo tháng</option>
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-blue">
            Trạng thái
            <select
              value={filters.status}
              onChange={(event) => setFilter("status", event.target.value)}
              className="h-11 w-full rounded-lg border border-platinum-tint bg-white px-3 text-sm text-midnight-indigo outline-none"
            >
              {bookingStatuses.map((status) => (
                <option key={status.value || "all"} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-blue">
            Nhà cung cấp
            <select
              value={filters.providerId}
              onChange={(event) => setFilter("providerId", event.target.value)}
              className="h-11 w-full rounded-lg border border-platinum-tint bg-white px-3 text-sm text-midnight-indigo outline-none"
            >
              <option value="">Tất cả nhà cung cấp</option>
              {(filterOptions.providers || []).map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.fullName}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-blue">
            Danh mục
            <select
              value={filters.categoryId}
              onChange={(event) => setFilter("categoryId", event.target.value)}
              className="h-11 w-full rounded-lg border border-platinum-tint bg-white px-3 text-sm text-midnight-indigo outline-none"
            >
              <option value="">Tất cả danh mục</option>
              {(filterOptions.categories || []).map((category) => (
                <option key={category.id} value={category.id}>
                  {"— ".repeat(Math.max((category.level || 1) - 1, 0))}
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-slate-blue">
            Dịch vụ
            <select
              value={filters.serviceId}
              onChange={(event) => setFilter("serviceId", event.target.value)}
              className="h-11 w-full rounded-lg border border-platinum-tint bg-white px-3 text-sm text-midnight-indigo outline-none"
            >
              <option value="">Tất cả dịch vụ</option>
              {(filterOptions.services || []).map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                  {service.provider?.fullName ? ` · ${service.provider.fullName}` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        {stats?.filterSummary && (
          <p className="mt-3 text-xs text-slate-blue">
            Báo cáo hiện tại: {stats.filterSummary}
          </p>
        )}
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={provinceData}
              margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E7EDF6" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#476788" }}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={54}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#476788" }} />
              <Tooltip
                formatter={(value: number) => [value, "Số đơn"]}
                cursor={{ fill: "#F8F9FB" }}
                contentStyle={{
                  borderRadius: "10px",
                  border: "1px solid #D4E0ED",
                  boxShadow: "var(--brand-shadow-sm)",
                }}
              />
              <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={revenueData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E7EDF6"
                />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#476788" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#476788" }}
                  tickFormatter={(value: number) => `${value / 1000}k`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${Number(value).toLocaleString("vi-VN")}₫`,
                    "Hoa hồng",
                  ]}
                  cursor={{ fill: "#F8F9FB" }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #D4E0ED",
                    boxShadow: "var(--brand-shadow-sm)",
                  }}
                />
                <Bar
                  dataKey="commission"
                  fill="#006BFF"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={statusData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal
                  vertical={false}
                  stroke="#E7EDF6"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="status"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#476788" }}
                  width={86}
                />
                <Tooltip
                  cursor={{ fill: "#F8F9FB" }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #D4E0ED",
                    boxShadow: "var(--brand-shadow-sm)",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                  {statusData.map((entry, index) => (
                    <Cell
                      key={`${entry.status}-${index}`}
                      fill={
                        entry.fill || statusColors[index % statusColors.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#E7EDF6" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#476788" }}
                  width={120}
                />
                <Tooltip
                  cursor={{ fill: "#F8F9FB" }}
                  formatter={(value: number) => [value, "Số đơn"]}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #D4E0ED",
                    boxShadow: "var(--brand-shadow-sm)",
                  }}
                />
                <Bar dataKey="count" fill="#006BFF" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
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
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={serviceData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#E7EDF6" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#476788" }}
                  width={120}
                />
                <Tooltip
                  cursor={{ fill: "#F8F9FB" }}
                  formatter={(value: number) => [value, "Số đơn"]}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #D4E0ED",
                    boxShadow: "var(--brand-shadow-sm)",
                  }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
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
    <div className="flex h-[280px] items-center justify-center text-center text-sm font-medium text-slate-blue">
      <div className="flex flex-col items-center gap-2">
        <Package className="size-5 text-slate-blue" />
        <span>{label}</span>
      </div>
    </div>
  );
}
