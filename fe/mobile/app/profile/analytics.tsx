import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';

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

const ranges = [
  { key: '7d', label: '7 ngày' },
  { key: '30d', label: '30 ngày' },
  { key: 'month', label: 'Tháng này' },
] as const;

export default function ProviderAnalyticsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [range, setRange] = useState<(typeof ranges)[number]['key']>('30d');
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const params = getRangeParams(range);

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await dashboardApi.getStats({
        ...params,
        groupBy: 'day',
        reportType: 'revenue',
      });
      setStats(response.data?.data ?? null);
    } catch {
      setError('Không thể tải dữ liệu hiệu suất. Kéo xuống để thử lại.');
    } finally {
      setLoading(false);
    }
  }, [params.from, params.to, range]);

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
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.light.primary]} />
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
            <Text variant="titleSmall" style={styles.cardTitle}>Khoảng thời gian</Text>
            <Text variant="bodySmall" style={styles.cardDescription}>
              Dữ liệu dùng cho phân tích xu hướng thu nhập và hiệu suất.
            </Text>
          </View>
          <MaterialCommunityIcons name="chart-timeline-variant" size={24} color={Colors.light.primaryLight} />
        </View>
        <View style={styles.rangeRow}>
          {ranges.map((item) => (
            <Button
              key={item.key}
              mode={range === item.key ? 'contained' : 'outlined'}
              onPress={() => setRange(item.key)}
              style={styles.rangeButton}
              compact
            >
              {item.label}
            </Button>
          ))}
        </View>
      </ProviderCard>

      <View style={styles.kpiRow}>
        <ProviderMetricCard icon="cash-multiple" label="Doanh thu ròng" value={loading ? '...' : formatCurrency(netRevenue)} tone="success" loading={loading} />
        <ProviderMetricCard icon="briefcase-check-outline" label="Tỉ lệ chốt" value={loading ? '...' : `${closeRate.toFixed(1)}%`} tone="info" loading={loading} />
        <ProviderMetricCard icon="star-outline" label="Đánh giá" value={stats?.avgRating ? `${Number(stats.avgRating).toFixed(1)}/5` : '—'} tone="warning" loading={loading} />
        <ProviderMetricCard icon="clipboard-text-outline" label="Tổng đơn" value={String(stats?.totalBookings ?? '—')} tone="neutral" loading={loading} />
      </View>

      <ProviderCard contentStyle={styles.chartCard}>
        <View style={styles.sectionTitleRow}>
          <Text variant="titleMedium" style={styles.cardTitle}>Xu hướng doanh thu</Text>
          <Text variant="labelSmall" style={styles.netLabel}>Đã trừ 15% hoa hồng</Text>
        </View>
        <LineChart
          data={{
            labels: chartLabels,
            datasets: [{ data: chartValues.slice(-6).map((value) => Math.max(value, 0)) }],
          }}
          width={chartWidth}
          height={220}
          chartConfig={{
            backgroundColor: Colors.light.surface,
            backgroundGradientFrom: Colors.light.surface,
            backgroundGradientTo: Colors.light.surface,
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(6, 182, 212, ${opacity})`,
            labelColor: () => Colors.light.textSecondary,
            propsForDots: { r: '3' },
          }}
          bezier
          style={styles.chart}
        />
      </ProviderCard>

      <ProviderCard>
        <View style={styles.aiHeader}>
          <View style={styles.aiIcon}>
            <MaterialCommunityIcons name="auto-fix" size={24} color={Colors.light.success} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={styles.cardTitle}>Gợi ý tối ưu thu nhập</Text>
            <Text variant="bodySmall" style={styles.cardDescription}>
              Online vào khung 18:00-21:00 và ưu tiên các quận có đơn đang chờ để tăng khả năng chốt đơn.
            </Text>
          </View>
        </View>
      </ProviderCard>
    </ScrollView>
  );
}

function getRangeParams(range: '7d' | '30d' | 'month') {
  const now = new Date();
  const from = new Date(now);
  if (range === 'month') from.setDate(1);
  if (range === '7d') from.setDate(now.getDate() - 7);
  if (range === '30d') from.setDate(now.getDate() - 30);

  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 112, gap: 16 },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: { color: Colors.light.text, fontWeight: '800' },
  cardDescription: {
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  rangeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  rangeButton: { borderRadius: 12, minHeight: 44 },
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chartCard: { paddingHorizontal: 0, gap: 12 },
  sectionTitleRow: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  netLabel: { color: Colors.light.success, fontWeight: '700' },
  chart: { borderRadius: 16 },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.successBg,
    borderWidth: 1,
    borderColor: `${Colors.light.success}44`,
  },
});
