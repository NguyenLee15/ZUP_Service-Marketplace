import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, IconButton, Text, useTheme, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProviderCard, ProviderInlineMessage, ProviderMetricCard, ProviderPageHeader } from '../../components/provider/provider-ui';
import { dashboardApi } from '../../features/booking/booking.api';
import { Colors } from '../../constants/colors';
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { API_BASE_URL } from "../../constants/api";
import { storage } from "../../lib/storage";

type Stats = {
  totalBookings: number;
  totalRevenue: number;
  avgRating: number;
  cancelRate: number;
  pendingCount: number;
  inProgressCount: number;
  doneCount: number;
  revenueData?: Array<{ period: string; revenue: number }>;
};

type PeriodKey = "this_week" | "this_month" | "last_month" | "this_year" | "last_year" | "all";

const PERIOD_OPTIONS: Array<{ key: PeriodKey; label: string }> = [
  { key: "this_week", label: "Tuần này" },
  { key: "this_month", label: "Tháng này" },
  { key: "last_month", label: "Tháng trước" },
  { key: "this_year", label: "Năm nay" },
  { key: "last_year", label: "Năm trước" },
  { key: "all", label: "Tất cả" },
];

const GROUP_OPTIONS: Array<{ key: "day" | "week" | "month"; label: string }> = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
];

export default function ProviderAnalyticsScreen() {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [message, setMessage] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(null);

  const params = periodParams(period, groupBy);

  const handleExport = async (type: "pdf" | "excel") => {
    setExporting(type);
    setMessage(null);
    try {
      const token = await storage.getAccessToken();
      if (!token) throw new Error("Phiên đăng nhập đã hết hạn.");

      const query = new URLSearchParams(
        Object.entries(params).reduce(
          (acc, [key, value]) => {
            if (value) acc[key] = value;
            return acc;
          },
          {} as Record<string, string>,
        ),
      ).toString();
      const extension = type === "pdf" ? "pdf" : "xlsx";
      const range = `${params.from || "tat-ca"}-${params.to || new Date().toISOString().slice(0, 10)}`;
      const fileUri = `${FileSystem.documentDirectory}provider-analytics-${range}-${Date.now()}.${extension}`;
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
          dialogTitle: "Báo cáo hiệu suất",
        });
      } else {
        setMessage({
          tone: "info",
          text: `Đã lưu file tại: ${result.uri}`,
        });
        return;
      }
      
      setMessage({
        tone: "success",
        text: `Đã tạo báo cáo hiệu suất (${type.toUpperCase()}).`,
      });
    } catch (error: unknown) {
      const friendlyMessage =
        error instanceof Error
          ? error.message.includes("Network")
            ? "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng."
            : error.message
          : "Đã xảy ra lỗi không xác định.";

      setMessage({
        tone: "error",
        text: friendlyMessage,
      });
    } finally {
      setExporting(null);
    }
  };

  const load = useCallback(async () => {
    setError('');
    setMessage(null);
    try {
      const response = await dashboardApi.getStats({
        ...params,
        reportType: 'revenue',
      });
      setStats(response.data?.data ?? null);
    } catch {
      setError('Không thể tải dữ liệu hiệu suất. Kéo xuống để thử lại.');
    } finally {
      setLoading(false);
    }
  }, [params.from, params.to, params.groupBy]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const formatCurrency = (amount?: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const closeRate = stats?.totalBookings
    ? Math.max(0, 100 - Number(stats.cancelRate || 0))
    : 0;
  const netRevenue = Math.max(0, Number(stats?.totalRevenue || 0) * 0.85);
  const chartValues = stats?.revenueData?.length
    ? stats.revenueData.map((item) => Math.max(0, item.revenue))
    : [0, 0, 0, 0];
  const chartLabels = stats?.revenueData?.length
    ? stats.revenueData.map((item) => item.period).slice(-6)
    : ['T1', 'T2', 'T3', 'T4'];
  const chartWidth = Math.max(width - 32, 280);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeColors.primary]} />
      }
    >
      <ProviderPageHeader
        title="Hiệu suất & doanh thu"
        subtitle="Theo dõi doanh thu ròng, đánh giá và cơ hội nhận thêm đơn."
        onBack={() => router.back()}
      />

      {error ? <ProviderInlineMessage tone="error" message={error} /> : null}
      {message ? <ProviderInlineMessage tone={message.tone} message={message.text} /> : null}

      <ProviderCard>
        <View style={styles.filterHeader}>
          <View>
            <Text variant="titleSmall" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Khoảng thời gian</Text>
            <Text variant="bodySmall" style={[styles.cardDescription, { color: theme.colors.onSurfaceVariant }]}>
              Dữ liệu dùng cho phân tích xu hướng thu nhập và hiệu suất.
            </Text>
          </View>
          <MaterialCommunityIcons name="chart-timeline-variant" size={24} color={activeColors.primaryLight} />
        </View>
        <Text variant="labelSmall" style={styles.filterLabel}>
          Thời gian
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScrollContent}>
          {PERIOD_OPTIONS.map((item) => (
            <Chip
              key={item.key}
              selected={period === item.key}
              onPress={() => setPeriod(item.key)}
              style={[styles.chip, period === item.key && styles.chipSelected]}
              textStyle={[styles.chipText, period === item.key && styles.chipTextSelected]}
              showSelectedOverlay={true}
            >
              {item.label}
            </Chip>
          ))}
        </ScrollView>

        <Text variant="labelSmall" style={styles.filterLabel}>
          Nhóm số liệu
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScrollContent}>
          {GROUP_OPTIONS.map((item) => (
            <Chip
              key={item.key}
              selected={groupBy === item.key}
              onPress={() => setGroupBy(item.key)}
              style={[styles.chip, groupBy === item.key && styles.chipSelected]}
              textStyle={[styles.chipText, groupBy === item.key && styles.chipTextSelected]}
              showSelectedOverlay={true}
            >
              {item.label}
            </Chip>
          ))}
        </ScrollView>
      </ProviderCard>

      <View style={styles.kpiRow}>
        <ProviderMetricCard icon="cash-multiple" label="Doanh thu ròng" value={loading ? '...' : formatCurrency(netRevenue)} tone="success" loading={loading} />
        <ProviderMetricCard icon="briefcase-check-outline" label="Tỉ lệ chốt" value={loading ? '...' : `${closeRate.toFixed(1)}%`} tone="info" loading={loading} />
        <ProviderMetricCard icon="star-outline" label="Đánh giá" value={stats?.avgRating ? `${Number(stats.avgRating).toFixed(1)}/5` : '—'} tone="warning" loading={loading} />
        <ProviderMetricCard icon="clipboard-text-outline" label="Tổng đơn" value={String(stats?.totalBookings ?? '—')} tone="neutral" loading={loading} />
      </View>

      <ProviderCard contentStyle={styles.chartCard}>
        <View style={styles.sectionTitleRow}>
          <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Xu hướng doanh thu</Text>
          <Text variant="labelSmall" style={[styles.netLabel, { color: activeColors.success }]}>Đã trừ 15% hoa hồng</Text>
        </View>
        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: chartValues.slice(-6).map((value) => Math.max(value, 0)) }],
          }}
          width={chartWidth}
          height={220}
          chartConfig={{
            backgroundColor: activeColors.surface,
            backgroundGradientFrom: activeColors.surface,
            backgroundGradientTo: activeColors.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
            labelColor: () => activeColors.textSecondary,
            propsForDots: { r: '3' },
          }}
          bezier
          style={styles.chart}
        />
      </ProviderCard>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <ProviderCard style={{ flex: 1 }} contentStyle={{ alignItems: "center", gap: 8 }}>
          <IconButton
            icon="file-pdf-box"
            iconColor={activeColors.error}
            size={32}
            mode="contained-tonal"
            containerColor={`${activeColors.error}16`}
            onPress={() => handleExport("pdf")}
            disabled={exporting !== null || loading || !stats}
          />
          <Text variant="labelMedium" style={{ fontWeight: "700" }}>
            Xuất PDF
          </Text>
        </ProviderCard>
        <ProviderCard style={{ flex: 1 }} contentStyle={{ alignItems: "center", gap: 8 }}>
          <IconButton
            icon="file-excel"
            iconColor={activeColors.success}
            size={32}
            mode="contained-tonal"
            containerColor={`${activeColors.success}16`}
            onPress={() => handleExport("excel")}
            disabled={exporting !== null || loading || !stats}
          />
          <Text variant="labelMedium" style={{ fontWeight: "700" }}>
            Xuất Excel
          </Text>
        </ProviderCard>
      </View>
    </ScrollView>
  );
}

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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 16 },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: { fontWeight: '800' },
  cardDescription: {
    marginTop: 4,
    lineHeight: 18,
  },
  filterLabel: {
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 8,
  },
  chipScrollContent: { gap: 8, paddingRight: 16 },
  chip: { borderRadius: 12 },
  chipSelected: { borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipTextSelected: { fontWeight: "700" },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  chartCard: { paddingHorizontal: 0, gap: 12 },
  sectionTitleRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  netLabel: { fontWeight: '700' },
  chart: { borderRadius: 16 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
