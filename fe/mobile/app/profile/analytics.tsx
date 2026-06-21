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

  const params = periodParams(period, groupBy);

  const load = useCallback(async () => {
    setError('');
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
        action={<IconButton icon="arrow-left" mode="contained-tonal" onPress={() => router.back()} accessibilityLabel="Quay lại" />}
      />

      {error ? <ProviderInlineMessage tone="error" message={error} /> : null}

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

      <ProviderCard>
        <View style={styles.aiHeader}>
          <View style={[styles.aiIcon, { backgroundColor: `${activeColors.success}16`, borderColor: `${activeColors.success}44` }]}>
            <MaterialCommunityIcons name="auto-fix" size={24} color={activeColors.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={[styles.cardTitle, { color: theme.colors.onSurface }]}>Gợi ý tối ưu thu nhập</Text>
            <Text variant="bodySmall" style={[styles.cardDescription, { color: theme.colors.onSurfaceVariant }]}>
              Online vào khung 18:00-21:00 và ưu tiên các quận có đơn đang chờ để tăng khả năng chốt đơn.
            </Text>
          </View>
        </View>
      </ProviderCard>
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
