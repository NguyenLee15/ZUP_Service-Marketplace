/**
 * Provider dashboard — Flighty/Seline style
 */
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  Chip,
  SegmentedButtons,
  Text,
  TouchableRipple,
  useTheme,
  Switch,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart, PieChart } from "react-native-chart-kit";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useAuthStore } from "../../features/auth/auth.store";
import { useNotificationStore } from "../../features/notification/notification.store";
import { routes } from "../../lib/route-utils";
import { dashboardApi, bookingApi } from "../../features/booking/booking.api";
import { profileApi } from "../../features/profile/profile.api";
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
type PeriodKey = "this_week" | "this_month" | "last_month" | "this_year" | "last_year" | "all";
type ReportTypeKey = "overview" | "revenue" | "status" | "bookings";

const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string }> = [
  { key: "this_week", label: "Tuần này" },
  { key: "this_month", label: "Tháng này" },
  { key: "last_month", label: "Tháng trước" },
  { key: "this_year", label: "Năm nay" },
  { key: "last_year", label: "Năm trước" },
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
  
  let from = new Date(now);
  let to = new Date(now);

  if (period === "this_week") {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    from.setDate(diff);
  } else if (period === "this_month") {
    from.setDate(1);
  } else if (period === "last_month") {
    from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    to = new Date(now.getFullYear(), now.getMonth(), 0);
  } else if (period === "this_year") {
    from = new Date(now.getFullYear(), 0, 1);
  } else if (period === "last_year") {
    from = new Date(now.getFullYear() - 1, 0, 1);
    to = new Date(now.getFullYear() - 1, 11, 31);
  }

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
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
  const { user, setOnlineStatus } = useAuthStore();
  const bookingSignal = useNotificationStore((state) => state.bookingSignal);
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const styles = getStyles(theme, activeColors, insets);

  const [todayStats, setTodayStats] = useState<Stats | null>(null);
  const [yesterdayStats, setYesterdayStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [message, setMessage] = useState<Message>(null);

  const fetchData = useCallback(async () => {
    setMessage(null);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    try {
      const [todayRes, yesterdayRes, bookingsRes] = await Promise.all([
        dashboardApi.getStats({ from: todayStr, to: todayStr, groupBy: 'day', reportType: 'overview' }).catch(() => null),
        dashboardApi.getStats({ from: yesterdayStr, to: yesterdayStr, groupBy: 'day', reportType: 'overview' }).catch(() => null),
        bookingApi
          .getMyBookings({ status: "PENDING", page: 1, limit: 5 })
          .catch(() => null),
      ]);
      if (todayRes?.data?.data) setTodayStats(todayRes.data.data);
      if (yesterdayRes?.data?.data) setYesterdayStats(yesterdayRes.data.data);
      if (bookingsRes?.data?.data) setRecentBookings(bookingsRes.data.data);
    } catch {
      setMessage({
        tone: "error",
        text: "Không thể tải dữ liệu tổng quan. Kéo xuống để thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleToggleOnline = async (newValue: boolean) => {
    setToggling(true);
    try {
      await profileApi.updateOnlineStatus(newValue);
      setOnlineStatus(newValue);
      setMessage({
        tone: "success",
        text: newValue ? "Đã bật trạng thái nhận đơn" : "Đã tắt trạng thái nhận đơn",
      });
    } catch (err: any) {
      const errMsg = err?.response?.data?.error?.message || err?.response?.data?.message || "Không thể cập nhật trạng thái hoạt động";
      setMessage({
        tone: "error",
        text: errMsg,
      });
    } finally {
      setToggling(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  // Tự động load dữ liệu mới khi có tín hiệu (ví dụ: có đơn hàng mới qua socket)
  useFocusEffect(
    useCallback(() => {
      if (bookingSignal) {
        fetchData();
      }
    }, [bookingSignal, fetchData])
  );

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

      const todayStr = new Date().toISOString().slice(0, 10);
      const query = new URLSearchParams({
        from: todayStr,
        to: todayStr,
        groupBy: "day",
        reportType: "overview",
      }).toString();
      const extension = type === "pdf" ? "pdf" : "xlsx";
      const fileUri = `${FileSystem.documentDirectory}provider-overview-${todayStr}-${Date.now()}.${extension}`;
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
          dialogTitle: "Báo cáo tổng quan",
        });
      }
      setMessage({
        tone: "success",
        text: `Đã tạo báo cáo tổng quan (${type.toUpperCase()}).`,
      });
    } catch (error: unknown) {
      if (type === "pdf") {
        try {
          const html = createProviderReportPdfFallback({
            stats: todayStats,
            reportLabel: "Tổng quan",
            reportSummary: "Báo cáo hôm nay",
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
              dialogTitle: "Báo cáo tổng quan",
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

  const chartWidth = Math.max(width - 32, 280);
  const revenueSeries = todayStats?.revenueData?.length
    ? todayStats.revenueData.map((item) => Math.max(0, item.revenue))
    : [
        (todayStats?.totalRevenue || 0) * 0.1,
        (todayStats?.totalRevenue || 0) * 0.3,
        (todayStats?.totalRevenue || 0) * 0.2,
        (todayStats?.totalRevenue || 0) * 0.4,
      ];
  const revenueLabels = todayStats?.revenueData?.length
    ? todayStats.revenueData.map((item) => item.period)
    : ["T1", "T2", "T3", "T4"];
  const statusChartData = [
    {
      name: "Chờ xác nhận",
      population: todayStats?.pendingCount || 0,
      color: activeColors.statusPending,
      legendFontColor: activeColors.textSecondary,
    },
    {
      name: "Đang làm",
      population: todayStats?.inProgressCount || 0,
      color: activeColors.statusInProgress,
      legendFontColor: activeColors.textSecondary,
    },
    {
      name: "Hoàn thành",
      population: todayStats?.doneCount || 0,
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text 
                variant="labelSmall" 
                style={{ 
                  color: user?.isOnline ? activeColors.success : activeColors.error,
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                {user?.isOnline ? "Đang nhận đơn" : "Đang nghỉ"}
              </Text>
              <Switch
                value={user?.isOnline ?? false}
                onValueChange={handleToggleOnline}
                disabled={toggling}
                color={activeColors.success}
              />
            </View>
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
          </View>
        }
      />

      {/* KYC Warning Banner */}
      {user?.kycStatus && user.kycStatus !== 'APPROVED' && (
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



      <View style={styles.sectionHeaderRow}>
        <View>
          <Text variant="titleMedium" style={styles.cardTitle}>Hiệu suất hôm nay</Text>
          <Text variant="bodySmall" style={styles.cardDescription}>So sánh với ngày hôm qua.</Text>
        </View>
        <Button mode="text" onPress={() => router.push(routes.profile.analytics)} compact textColor={activeColors.primary}>
          Chi tiết
        </Button>
      </View>

      <View style={styles.kpiRow}>
        <ProviderMetricCard
          icon="clipboard-check-outline"
          label="Tổng đơn"
          value={String(todayStats?.totalBookings ?? "—")}
          trend={todayStats && yesterdayStats ? todayStats.totalBookings - yesterdayStats.totalBookings : undefined}
          tone="info"
          loading={loading}
        />
        <ProviderMetricCard
          icon="cash-multiple"
          label="Doanh thu"
          value={todayStats ? formatCurrency(todayStats.totalRevenue) : "—"}
          trend={todayStats && yesterdayStats ? todayStats.totalRevenue - yesterdayStats.totalRevenue : undefined}
          tone="success"
          loading={loading}
        />
        <ProviderMetricCard
          icon="star-outline"
          label="Đánh giá"
          value={
            todayStats?.avgRating
              ? `${Number(todayStats.avgRating).toFixed(1)}/5`
              : "—"
          }
          tone="warning"
          loading={loading}
        />
        <ProviderMetricCard
          icon="cancel"
          label="Tỷ lệ hủy"
          value={
            todayStats?.cancelRate != null
              ? `${Math.round(Number(todayStats.cancelRate))}%`
              : "—"
          }
          trend={todayStats && yesterdayStats ? Math.round(Number(todayStats.cancelRate)) - Math.round(Number(yesterdayStats.cancelRate)) : undefined}
          trendSuffix="%"
          tone="error"
          loading={loading}
        />
      </View>

      <ProviderSectionHeader title="Tổng quan trạng thái" />
      <ProviderCard>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          <View style={{ flex: 1, minWidth: "45%" }}>
            <Text variant="labelSmall" style={{ color: activeColors.textSecondary }}>Chờ xác nhận</Text>
            <Text variant="titleLarge" style={{ color: activeColors.statusPending, fontWeight: "700" }}>{todayStats?.pendingCount || 0}</Text>
          </View>
          <View style={{ flex: 1, minWidth: "45%" }}>
            <Text variant="labelSmall" style={{ color: activeColors.textSecondary }}>Đang thực hiện</Text>
            <Text variant="titleLarge" style={{ color: activeColors.statusInProgress, fontWeight: "700" }}>{todayStats?.inProgressCount || 0}</Text>
          </View>
          <View style={{ flex: 1, minWidth: "45%" }}>
            <Text variant="labelSmall" style={{ color: activeColors.textSecondary }}>Đã hoàn thành</Text>
            <Text variant="titleLarge" style={{ color: activeColors.statusDone, fontWeight: "700" }}>{todayStats?.doneCount || 0}</Text>
          </View>
        </View>
      </ProviderCard>
      <ProviderSectionHeader title="Xu hướng doanh thu" />
      <ProviderCard contentStyle={styles.chartCard}>
        <LineChart
          data={{
            labels: revenueLabels.slice(-6),
            datasets: [
              {
                data: revenueSeries.length ? revenueSeries.slice(-6).map((value: number) => Math.max(value, 0)) : [0],
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

      <ProviderSectionHeader title="Đơn mới cần xử lý" />
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
  reportTypeButton: { borderRadius: 10, minWidth: "47%" },
  reportTypeContent: { minHeight: 42 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  chipScrollContent: { gap: 8, paddingRight: 16 },
  chip: { borderRadius: 12, backgroundColor: theme.colors.elevation.level1 },
  chipSelected: { backgroundColor: activeColors.primarySoft, borderColor: activeColors.primary, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "600", color: activeColors.textSecondary },
  chipTextSelected: { color: activeColors.primary, fontWeight: "700" },
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
