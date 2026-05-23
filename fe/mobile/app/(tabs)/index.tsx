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
import { Button, Switch, Text, TouchableRipple, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart, PieChart } from "react-native-chart-kit";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useAuthStore } from "../../features/auth/auth.store";
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
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [online, setOnline] = useState(false);
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
    setExporting(true);
    setMessage(null);
    try {
      const token = await getFreshAccessToken();
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn.");

      const query = new URLSearchParams(reportParams).toString();
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
    } catch (error: any) {
      setMessage({
        tone: "error",
        text:
          error?.message ||
          "Không thể xuất báo cáo. Vui lòng thử lại sau.",
      });
    } finally {
      setExporting(false);
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
      color: Colors.light.statusPending,
      legendFontColor: Colors.light.textSecondary,
    },
    {
      name: "Đang làm",
      population: stats?.inProgressCount || 0,
      color: Colors.light.statusInProgress,
      legendFontColor: Colors.light.textSecondary,
    },
    {
      name: "Hoàn thành",
      population: stats?.doneCount || 0,
      color: Colors.light.statusDone,
      legendFontColor: Colors.light.textSecondary,
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
          colors={[Colors.light.primary]}
        />
      }
    >
      <ProviderPageHeader
        title="Tổng quan"
        subtitle={`Xin chào, ${user?.fullName || "nhà cung cấp"}`}
        action={
          <TouchableRipple
            onPress={() => router.push("/notifications" as any)}
            borderless
            style={styles.iconButton}
            accessibilityLabel="Mở thông báo"
          >
            <MaterialCommunityIcons
              name="bell-outline"
              size={22}
              color={Colors.light.text}
            />
          </TouchableRipple>
        }
      />

      {message && (
        <ProviderInlineMessage tone={message.tone} message={message.text} />
      )}

      <ProviderCard
        style={[
          styles.onlineCard,
          online && { borderColor: Colors.light.success, backgroundColor: Colors.light.successBg },
        ]}
        contentStyle={styles.onlineContent}
      >
        <View style={styles.onlineText}>
          <View style={[styles.onlineIcon, { backgroundColor: online ? `${Colors.light.success}22` : Colors.light.surfaceVariant }]}>
            <MaterialCommunityIcons
              name={online ? "access-point" : "access-point-off"}
              size={24}
              color={online ? Colors.light.success : Colors.light.textSecondary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {online ? "Đang nhận việc" : "Tạm ngưng nhận việc"}
            </Text>
            <Text variant="bodySmall" style={styles.cardDescription}>
              Bật trạng thái online để hệ thống ưu tiên gợi ý đơn gần vị trí của bạn.
            </Text>
          </View>
        </View>
        <Switch value={online} onValueChange={setOnline} color={Colors.light.success} />
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
            color={Colors.light.primary}
          />
        </View>
        <Text variant="labelSmall" style={styles.filterLabel}>
          Thời gian
        </Text>
        <View style={styles.filterRow}>
          {PERIOD_OPTIONS.map((item) => (
            <Button
              key={item.key}
              mode={period === item.key ? "contained" : "outlined"}
              compact
              onPress={() => setPeriod(item.key as PeriodKey)}
              style={styles.filterButton}
            >
              {item.label}
            </Button>
          ))}
        </View>
        <Text variant="labelSmall" style={styles.filterLabel}>
          Nhóm số liệu
        </Text>
        <View style={styles.filterRow}>
          {GROUP_OPTIONS.map((item) => (
            <Button
              key={item.key}
              mode={groupBy === item.key ? "contained-tonal" : "outlined"}
              compact
              onPress={() => setGroupBy(item.key as "day" | "week" | "month")}
              style={styles.filterButton}
            >
              {item.label}
            </Button>
          ))}
        </View>
        <Text variant="labelSmall" style={styles.filterLabel}>
          Loại báo cáo
        </Text>
        <View style={styles.filterRow}>
          {REPORT_TYPE_OPTIONS.map((item) => (
            <Button
              key={item.key}
              mode={reportType === item.key ? "contained" : "outlined"}
              compact
              onPress={() => setReportType(item.key)}
              style={styles.filterButton}
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
              color={Colors.light.statusPending}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/bookings" as any,
                  params: { status: "PENDING" },
                })
              }
            />
            <ProviderStatusChip
              label={`Đang thực hiện: ${stats?.inProgressCount ?? 0}`}
              color={Colors.light.statusInProgress}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/bookings" as any,
                  params: { status: "IN_PROGRESS" },
                })
              }
            />
            <ProviderStatusChip
              label={`Hoàn thành: ${stats?.doneCount ?? 0}`}
              color={Colors.light.statusDone}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/bookings" as any,
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
                backgroundColor: Colors.light.surface,
                backgroundGradientFrom: Colors.light.surface,
                backgroundGradientTo: Colors.light.surface,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                labelColor: () => Colors.light.textSecondary,
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
              color={Colors.light.error}
            />
            <Text variant="labelMedium" style={styles.exportLabel}>
              PDF
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
              color={Colors.light.success}
            />
            <Text variant="labelMedium" style={styles.exportLabel}>
              Excel
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
            onAction={() => router.push("/(tabs)/bookings" as any)}
          />

          {recentBookings.length === 0 ? (
            <ProviderCard>
              <ProviderEmptyState
                icon="clipboard-check-outline"
                title="Chưa có đơn hàng mới"
                description="Khi có yêu cầu mới, bạn sẽ thấy chúng ở đây."
                actionLabel="Xem đơn hàng"
                onAction={() => router.push("/(tabs)/bookings" as any)}
              />
            </ProviderCard>
          ) : (
            recentBookings.map((booking) => (
              <ProviderCard
                key={booking.id}
                onPress={() => router.push(`/booking/${booking.id}` as any)}
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
                    color={Colors.light.statusPending}
                  />
                </View>
                <View style={styles.bookingFooter}>
                  <MaterialCommunityIcons
                    name="calendar-outline"
                    size={14}
                    color={Colors.light.textSecondary}
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 112, gap: 16 },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  onlineCard: {
    borderColor: Colors.light.borderStrong,
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
  cardTitle: { color: Colors.light.text, fontWeight: "700" },
  cardDescription: {
    color: Colors.light.textSecondary,
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
    color: Colors.light.textSecondary,
    fontWeight: "700",
    marginTop: 14,
  },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  filterButton: { borderRadius: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chartCard: { paddingHorizontal: 0, alignItems: "center" },
  chart: { borderRadius: 12 },
  exportRow: { flexDirection: "row", gap: 12 },
  exportCard: { flex: 1 },
  exportContent: { alignItems: "center", gap: 8 },
  exportLabel: { color: Colors.light.text, fontWeight: "700" },
  bookingRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bookingCode: { color: Colors.light.primary, fontWeight: "700" },
  bookingTitle: { color: Colors.light.text, fontWeight: "700", marginTop: 4 },
  bookingMeta: { color: Colors.light.textSecondary, marginTop: 2 },
  bookingFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  bookingDate: { color: Colors.light.textSecondary, marginLeft: 4 },
});
