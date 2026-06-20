/**
 * Provider dashboard — Flighty/Seline style
 */
import { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  SegmentedButtons,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart, PieChart } from "react-native-chart-kit";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useAuthStore } from "../../features/auth/auth.store";
import { routes } from "../../lib/route-utils";
import { dashboardApi, bookingApi } from "../../features/booking/booking.api";
import { BOOKING_STATUS_LABEL } from "../../constants/booking-status";
import { Colors } from "../../constants/colors";
import { API_BASE_URL } from "../../constants/api";
import { storage } from "../../lib/storage";
import {
  ProviderCard,
  ProviderEmptyState,
  ProviderInlineMessage,
  ProviderMetricCard,
  ProviderPageHeader,
  ProviderSectionHeader,
  ProviderStatusChip,
} from "../../components/provider/provider-ui";

interface Stats {
  totalBookings: number;
  totalRevenue: number;
  avgRating: number;
  cancelRate: number;
  pendingCount: number;
  inProgressCount: number;
  doneCount: number;
  filterSummary?: string;
  revenueData?: Array<{ period: string; revenue: number }>;
  statusData?: Array<{ status: string; count: number }>;
}

type Message = {
  tone: "info" | "success" | "warning" | "error";
  text: string;
} | null;
type PeriodKey = "month" | "7d" | "30d" | "all";
type ReportTypeKey = "overview" | "revenue" | "status" | "bookings";

const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string }> = [
  { key: "month", label: "Tháng này" },
  { key: "7d", label: "7 ngày" },
  { key: "30d", label: "30 ngày" },
  { key: "all", label: "Tất cả" },
];

const GROUP_OPTIONS: Array<{
  key: "day" | "week" | "month";
  label: string;
}> = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
];

const REPORT_TYPE_OPTIONS: Array<{ key: ReportTypeKey; label: string }> = [
  { key: "overview", label: "Tổng quan" },
  { key: "revenue", label: "Doanh thu" },
  { key: "status", label: "Trạng thái" },
  { key: "bookings", label: "Đơn hàng" },
];

function periodParams(
  period: PeriodKey,
  groupBy: "day" | "week" | "month",
): { from?: string; to?: string; groupBy: "day" | "week" | "month" } {
  const now = new Date();
  if (period === "all") return { groupBy };
  const from = new Date(now);
  if (period === "month") from.setDate(1);
  if (period === "7d") from.setDate(now.getDate() - 7);
  if (period === "30d") from.setDate(now.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
    groupBy,
  };
}

function displayDate(value?: string) {
  if (!value) return "Tất cả thời gian";
  return new Date(value).toLocaleDateString("vi-VN");
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createProviderReportPdfFallback({
  stats,
  reportLabel,
  reportSummary,
  formatCurrency,
}: {
  stats: Stats | null;
  reportLabel: string;
  reportSummary: string;
  formatCurrency: (amount: number) => string;
}) {
  const rows = [
    ["Tổng đơn", stats?.totalBookings ?? 0],
    ["Doanh thu", formatCurrency(stats?.totalRevenue ?? 0)],
    [
      "Đánh giá",
      stats?.avgRating ? `${Number(stats.avgRating).toFixed(1)}/5` : "—",
    ],
    [
      "Tỷ lệ hủy",
      stats?.cancelRate != null
        ? `${Number(stats.cancelRate).toFixed(1)}%`
        : "—",
    ],
    ["Chờ xác nhận", stats?.pendingCount ?? 0],
    ["Đang thực hiện", stats?.inProgressCount ?? 0],
    ["Hoàn thành", stats?.doneCount ?? 0],
  ];

  const revenueRows = stats?.revenueData?.length
    ? stats.revenueData
    : [{ period: "Chưa có dữ liệu", revenue: 0 }];

  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; margin: 28px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 15px; margin: 22px 0 8px; }
    .muted { color: #475569; font-size: 12px; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 9px 6px; text-align: left; font-size: 12px; }
    th { background: #f1f5f9; font-weight: 700; }
    .signature { display: flex; justify-content: space-between; margin-top: 40px; color: #475569; }
  </style>
</head>
<body>
  <h1>Zup Đối Tác</h1>
  <div class="muted">${escapeHtml(reportLabel)} · ${escapeHtml(reportSummary)}<br/>Xuất lúc ${escapeHtml(new Date().toLocaleString("vi-VN"))}</div>
  <h2>Chỉ số chính</h2>
  <table>
    <tbody>${rows
      .map(
        ([label, value]) =>
          `<tr><td>${escapeHtml(label)}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`,
      )
      .join("")}</tbody>
  </table>
  <h2>Doanh thu theo kỳ</h2>
  <table>
    <thead><tr><th>Kỳ</th><th>Doanh thu</th></tr></thead>
    <tbody>${revenueRows
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.period)}</td><td>${escapeHtml(formatCurrency(Number(item.revenue)))}</td></tr>`,
      )
      .join("")}</tbody>
  </table>
  <div class="signature"><span>Nhà cung cấp</span><span>Người xác nhận</span></div>
</body>
</html>`;
}

async function getFreshAccessToken() {
  const refreshToken = await storage.getRefreshToken();
  if (!refreshToken) return storage.getAccessToken();

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return storage.getAccessToken();

    const payload = await response.json();
    const accessToken = payload?.data?.accessToken;
    const nextRefreshToken = payload?.data?.refreshToken;
    if (accessToken && nextRefreshToken) {
      await storage.setTokens(accessToken, nextRefreshToken);
      return accessToken;
    }
  } catch {
    return storage.getAccessToken();
  }

  return storage.getAccessToken();
}

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const styles = getStyles(theme, activeColors, insets);

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [message, setMessage] = useState<Message>(null);
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("week");
  const [reportType, setReportType] = useState<ReportTypeKey>("overview");
  const reportParams: {
    from?: string;
    to?: string;
    groupBy: "day" | "week" | "month";
    reportType: ReportTypeKey;
  } = { ...periodParams(period, groupBy), reportType };
  const selectedReportLabel =
    REPORT_TYPE_OPTIONS.find((item) => item.key === reportType)?.label ||
    "Tổng quan";
  const selectedGroupLabel =
    GROUP_OPTIONS.find((item) => item.key === groupBy)?.label || "Tuần";
  const reportSummary =
    period === "all"
      ? `${selectedReportLabel} · Tất cả thời gian · Theo ${selectedGroupLabel.toLowerCase()}`
      : `${selectedReportLabel} · ${displayDate(reportParams.from)} - ${displayDate(reportParams.to)} · Theo ${selectedGroupLabel.toLowerCase()}`;

  const fetchData = useCallback(async () => {
    setMessage(null);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        dashboardApi.getStats(reportParams).catch(() => null),
        bookingApi
          .getMyBookings({ status: "PENDING", page: 1, limit: 5 })
          .catch(() => null),
      ]);
      if (statsRes?.data?.data) setStats(statsRes.data.data);
      if (bookingsRes?.data?.data) setRecentBookings(bookingsRes.data.data);
    } catch {
      setMessage({
        tone: "error",
        text: "Không thể tải dữ liệu tổng quan. Kéo xuống để thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }, [
    reportParams.from,
    reportParams.to,
    reportParams.groupBy,
    reportParams.reportType,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const handleExport = async (type: "pdf" | "excel") => {
    setExporting(type);
    setMessage(null);
    try {
      const token = await getFreshAccessToken();
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn.");

      const query = new URLSearchParams(
        Object.entries(reportParams).reduce(
          (acc, [key, value]) => {
            if (value) acc[key] = value;
            return acc;
          },
          {} as Record<string, string>,
        ),
      ).toString();
      const extension = type === "pdf" ? "pdf" : "xlsx";
      const range = `${reportParams.from || "tat-ca"}-${reportParams.to || new Date().toISOString().slice(0, 10)}`;
      const fileUri = `${FileSystem.documentDirectory}provider-${reportType}-${range}-${Date.now()}.${extension}`;
      const downloadUrl = `${API_BASE_URL}/provider/dashboard/export-${type === "pdf" ? "pdf" : "excel"}?${query}`;
      const result = await FileSystem.downloadAsync(downloadUrl, fileUri, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (result.status && result.status >= 400) {
        throw new Error(`Xuất báo cáo thất bại (${result.status}).`);
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(result.uri, {
          mimeType:
            type === "pdf"
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: `Báo cáo ${selectedReportLabel}`,
        });
      }
      setMessage({
        tone: "success",
        text: `Đã tạo báo cáo ${selectedReportLabel} (${type.toUpperCase()}).`,
      });
    } catch (error: unknown) {
      if (type === "pdf") {
        try {
          const html = createProviderReportPdfFallback({
            stats,
            reportLabel: selectedReportLabel,
            reportSummary,
            formatCurrency,
          });
          const result = await Print.printToFileAsync({
            html,
            base64: false,
          });
          const isAvailable = await Sharing.isAvailableAsync();
          if (isAvailable) {
            await Sharing.shareAsync(result.uri, {
              mimeType: "application/pdf",
              dialogTitle: `Báo cáo ${selectedReportLabel}`,
            });
          }
          setMessage({
            tone: "warning",
            text: "Máy chủ chưa xuất được PDF, app đã tạo bản báo cáo tạm để bạn chia sẻ.",
          });
          return;
        } catch {
          // Fall through to the friendly error below.
        }
      }

      const friendlyMessage =
        error instanceof Error
          ? error.message
          : "Không thể xuất báo cáo. Vui lòng thử lại sau.";
      setMessage({
        tone: "error",
        text: friendlyMessage,
      });
    } finally {
      setExporting(null);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);

  const chartWidth = Math.max(width - 64, 280);
  const revenueSeries = stats?.revenueData?.length
    ? stats.revenueData.map((item) => item.revenue)
    : [
        (stats?.totalRevenue || 0) * 0.1,
        (stats?.totalRevenue || 0) * 0.3,
        (stats?.totalRevenue || 0) * 0.2,
        (stats?.totalRevenue || 0) * 0.4,
      ];
  const revenueLabels = stats?.revenueData?.length
    ? stats.revenueData.map((item) => item.period)
    : ["Tuần 1", "Tuần 2", "Tuần 3", "Tuần 4"];
  const statusChartData = [
    {
      name: "Chờ xác nhận",
      population: stats?.pendingCount || 0,
      color: activeColors.statusPending,
      legendFontColor: activeColors.textSecondary,
    },
    {
      name: "Đang làm",
      population: stats?.inProgressCount || 0,
      color: activeColors.statusInProgress,
      legendFontColor: activeColors.textSecondary,
    },
    {
      name: "Hoàn thành",
      population: stats?.doneCount || 0,
      color: activeColors.statusDone,
      legendFontColor: activeColors.textSecondary,
    },
  ];
  const hasStatusData = statusChartData.some((item) => item.population > 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[activeColors.primary]}
        />
      }
    >
      <ProviderPageHeader
        title="Tổng quan"
        subtitle={`Xin chào, ${user?.fullName || "nhà cung cấp"}`}
        action={
          <TouchableRipple
            onPress={() => router.push(routes.notifications)}
            borderless
            style={styles.iconButton}
            accessibilityLabel="Mở thông báo"
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={22}
              color={activeColors.text}
            />
          </TouchableRipple>
        }
      />

      {/* KYC Warning Banner */}
      {user?.kycStatus !== 'APPROVED' && (
        <TouchableRipple
          onPress={() => router.push('/profile/kyc')}
          style={styles.kycBanner}
          borderless
        >
          <View style={styles.kycBannerContent}>
            <MaterialCommunityIcons name="shield-alert-outline" size={24} color="#D97706" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#92400E', fontWeight: 'bold', fontSize: 14 }}>
                {user?.kycStatus === 'PENDING' ? 'Hồ sơ đang chờ duyệt' : 'Tài khoản chưa xác thực'}
              </Text>
              <Text style={{ color: '#B45309', fontSize: 13, marginTop: 2 }}>
                {user?.kycStatus === 'PENDING' 
                  ? 'Chúng tôi đang kiểm tra CCCD của bạn. Vui lòng chờ.' 
                  : 'Vui lòng xác minh CCCD để bắt đầu nhận việc.'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#D97706" />
          </View>
        </TouchableRipple>
      )}

      {message && (
        <ProviderInlineMessage tone={message.tone} message={message.text} />
      )}

      <ProviderCard
        style={styles.onlineCard}
        contentStyle={styles.onlineContent}
        onPress={() => router.push(routes.services)}
        accessibilityLabel="Kiểm tra trạng thái nhận đơn"
      >
        <View style={styles.onlineText}>
          <View style={[styles.onlineIcon, { backgroundColor: `${activeColors.success}18` }]}>
            <MaterialCommunityIcons
              name="briefcase-check-outline"
              size={24}
              color={activeColors.success}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {user?.status === "ACTIVE" ? "Sẵn sàng nhận đơn" : "Tài khoản cần kiểm tra"}
            </Text>
            <Text variant="bodySmall" style={styles.cardDescription}>
              Hệ thống nhận đơn dựa trên tài khoản, KYC, ví và các dịch vụ đang hoạt động.
            </Text>
          </View>
        </View>
        <ProviderStatusChip
          label={user?.status === "ACTIVE" ? "Hoạt động" : "Kiểm tra"}
          color={user?.status === "ACTIVE" ? activeColors.success : activeColors.warning}
        />
      </ProviderCard>

      <ProviderCard>
        <View style={styles.filterHeader}>
          <View>
            <Text variant="titleSmall" style={styles.cardTitle}>
              Kỳ báo cáo
            </Text>
            <Text variant="bodySmall" style={styles.cardDescription}>
              {reportSummary}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="tune-variant"
            size={22}
            color={activeColors.primary}
          />
        </View>
        <Text variant="labelSmall" style={styles.filterLabel}>
          Thời gian
        </Text>
        <SegmentedButtons
          value={period}
          onValueChange={(value) => setPeriod(value as PeriodKey)}
          buttons={PERIOD_OPTIONS.map((item) => ({
            value: item.key,
            label: item.label,
          }))}
          style={styles.segmented}
        />
        <Text variant="labelSmall" style={styles.filterLabel}>
          Nhóm số liệu
        </Text>
        <SegmentedButtons
          value={groupBy}
          onValueChange={(value) =>
            setGroupBy(value as "day" | "week" | "month")
          }
          buttons={GROUP_OPTIONS.map((item) => ({
            value: item.key,
            label: item.label,
          }))}
          style={styles.segmented}
        />
        <Text variant="labelSmall" style={styles.filterLabel}>
          Loại báo cáo
        </Text>
        <View style={styles.reportTypeGrid}>
          {REPORT_TYPE_OPTIONS.map((item) => (
            <Button
              key={item.key}
              mode={reportType === item.key ? "contained" : "outlined"}
              compact
              onPress={() => setReportType(item.key)}
              style={styles.reportTypeButton}
              contentStyle={styles.reportTypeContent}
            >
              {item.label}
            </Button>
          ))}
        </View>
      </ProviderCard>

      {reportType === "overview" && (
        <View style={styles.kpiRow}>
          <ProviderMetricCard
            icon="clipboard-check-outline"
            label="Tổng đơn"
            value={String(stats?.totalBookings ?? "—")}
            tone="info"
            loading={loading}
          />
          <ProviderMetricCard
            icon="cash-multiple"
            label="Doanh thu"
            value={stats ? formatCurrency(stats.totalRevenue) : "—"}
            tone="success"
            loading={loading}
          />
          <ProviderMetricCard
            icon="star-outline"
            label="Đánh giá"
            value={
              stats?.avgRating
                ? `${Number(stats.avgRating).toFixed(1)}/5`
                : "—"
            }
            tone="warning"
            loading={loading}
          />
          <ProviderMetricCard
            icon="cancel"
            label="Tỷ lệ hủy"
            value={
              stats?.cancelRate != null
                ? `${Number(stats.cancelRate).toFixed(1)}%`
                : "—"
            }
            tone="error"
            loading={loading}
          />
        </View>
      )}

      {["overview", "status"].includes(reportType) && (
        <>
          <View style={styles.chipRow}>
            <ProviderStatusChip
              label={`Chờ xác nhận: ${stats?.pendingCount ?? 0}`}
              color={activeColors.statusPending}
              onPress={() =>
                router.push({
                  pathname: routes.tabs.bookings,
                  params: { status: "PENDING" },
                })
              }
            />
            <ProviderStatusChip
              label={`Đang thực hiện: ${stats?.inProgressCount ?? 0}`}
              color={activeColors.statusInProgress}
              onPress={() =>
                router.push({
                  pathname: routes.tabs.bookings,
                  params: { status: "IN_PROGRESS" },
                })
              }
            />
            <ProviderStatusChip
              label={`Hoàn thành: ${stats?.doneCount ?? 0}`}
              color={activeColors.statusDone}
              onPress={() =>
                router.push({
                  pathname: routes.tabs.bookings,
                  params: { status: "DONE" },
                })
              }
            />
          </View>

          <ProviderSectionHeader title="Tỉ trọng trạng thái đơn" />
          <ProviderCard contentStyle={styles.chartCard}>
            {hasStatusData ? (
              <PieChart
                data={statusChartData}
                width={chartWidth}
                height={200}
                chartConfig={{
                  color: (opacity = 1) => `rgba(249, 250, 251, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="12"
                absolute
              />
            ) : (
              <ProviderEmptyState
                icon="chart-pie"
                title="Chưa có dữ liệu trạng thái"
                description="Các đơn hàng mới sẽ xuất hiện trong biểu đồ này."
              />
            )}
          </ProviderCard>
        </>
      )}

      {["overview", "revenue"].includes(reportType) && (
        <>
          <ProviderSectionHeader title="Xu hướng doanh thu" />
          <ProviderCard contentStyle={styles.chartCard}>
            <LineChart
              data={{
                labels: revenueLabels.slice(-6),
                datasets: [
                  {
                    data: revenueSeries
                      .slice(-6)
                      .map((value) => Math.max(value, 0)),
                  },
                ],
              }}
              width={chartWidth}
              height={220}
              chartConfig={{
                backgroundColor: activeColors.surface,
                backgroundGradientFrom: activeColors.surface,
                backgroundGradientTo: activeColors.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                labelColor: () => activeColors.textSecondary,
                propsForDots: { r: "3" },
              }}
              bezier
              style={styles.chart}
            />
          </ProviderCard>
        </>
      )}

      <ProviderSectionHeader title={`Xuất ${selectedReportLabel.toLowerCase()}`} />
      <View style={styles.exportRow}>
        <ProviderCard
          style={styles.exportCard}
          onPress={() => handleExport("pdf")}
          accessibilityLabel="Xuất báo cáo PDF"
        >
          <View style={styles.exportContent}>
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={32}
              color={activeColors.error}
            />
            <Text variant="labelMedium" style={styles.exportLabel}>
              {exporting === "pdf" ? "Đang tạo…" : "PDF"}
            </Text>
          </View>
        </ProviderCard>
        <ProviderCard
          style={styles.exportCard}
          onPress={() => handleExport("excel")}
          accessibilityLabel="Xuất báo cáo Excel"
        >
          <View style={styles.exportContent}>
            <MaterialCommunityIcons
              name="file-excel-box"
              size={32}
              color={activeColors.success}
            />
            <Text variant="labelMedium" style={styles.exportLabel}>
              {exporting === "excel" ? "Đang tạo…" : "Excel"}
            </Text>
          </View>
        </ProviderCard>
      </View>
      {exporting && (
        <ProviderInlineMessage tone="info" message="Đang xử lý báo cáo…" />
      )}

      {["overview", "bookings"].includes(reportType) && (
        <>
          <ProviderSectionHeader
            title="Đơn mới cần xử lý"
            actionLabel="Xem tất cả"
            onAction={() => router.push(routes.tabs.bookings)}
          />

          {recentBookings.length === 0 ? (
            <ProviderCard>
              <ProviderEmptyState
                icon="clipboard-check-outline"
                title="Chưa có đơn hàng mới"
                description="Khi có yêu cầu mới, bạn sẽ thấy chúng ở đây."
                actionLabel="Xem đơn hàng"
                onAction={() => router.push(routes.tabs.bookings)}
              />
            </ProviderCard>
          ) : (
            recentBookings.map((booking) => (
              <ProviderCard
                key={booking.id}
                onPress={() => router.push(routes.booking.detail(String(booking.id)))}
                accessibilityLabel={`Mở đơn hàng ${booking.bookingCode}`}
              >
                <View style={styles.bookingRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      variant="labelSmall"
                      style={styles.bookingCode}
                      selectable
                    >
                      #{booking.bookingCode}
                    </Text>
                    <Text
                      variant="bodyLarge"
                      style={styles.bookingTitle}
                      numberOfLines={1}
                    >
                      {booking.service?.name || "Dịch vụ"}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={styles.bookingMeta}
                      numberOfLines={1}
                    >
                      {booking.customer?.fullName} · {booking.district},{" "}
                      {booking.province}
                    </Text>
                  </View>
                  <ProviderStatusChip
                    label={
                      BOOKING_STATUS_LABEL[
                        booking.status as keyof typeof BOOKING_STATUS_LABEL
                      ] || booking.status
                    }
                    color={activeColors.statusPending}
                  />
                </View>
                <View style={styles.bookingFooter}>
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={14}
                    color={activeColors.textSecondary}
                  />
                  <Text variant="labelSmall" style={styles.bookingDate}>
                    {new Date(booking.desiredTime).toLocaleDateString("vi-VN")}
                  </Text>
                </View>
              </ProviderCard>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const getStyles = (theme: any, activeColors: any, insets: any) => StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 76 + insets.bottom, gap: 16 },
  kycBanner: {
    marginBottom: 0,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    overflow: 'hidden',
  },
  kycBannerContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  onlineCard: {
  },
  onlineContent: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  onlineText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  onlineIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  cardTitle: { fontWeight: "700" },
  cardDescription: {
    marginTop: 2,
    lineHeight: 18,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  filterLabel: {
    fontWeight: "700",
    marginTop: 14,
  },
  segmented: { marginTop: 10 },
  reportTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  reportTypeButton: { borderRadius: 10, minWidth: "47%" },
  reportTypeContent: { minHeight: 42 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chartCard: { paddingHorizontal: 0, alignItems: "center" },
  chart: { borderRadius: 12 },
  exportRow: { flexDirection: "row", gap: 12 },
  exportCard: { flex: 1 },
  exportContent: { alignItems: "center", gap: 8 },
  exportLabel: { fontWeight: "700" },
  bookingRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bookingCode: { color: activeColors.primary, fontWeight: "700" },
  bookingTitle: { fontWeight: "700", marginTop: 4 },
  bookingMeta: { marginTop: 2 },
  bookingFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  bookingDate: { marginLeft: 4 },
});
