/**
 * Provider booking queue
 */
import { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  Text,
  Searchbar,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
import { useFocusEffect } from 'expo-router';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { routes } from '../../lib/route-utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { bookingApi } from '../../features/booking/booking.api';
import { useNotificationStore } from '../../features/notification/notification.store';
import {
  BOOKING_STATUS_LABEL,
  type BookingStatus,
} from '../../constants/booking-status';
import { Colors } from '../../constants/colors';
import {
  ProviderCard,
  ProviderEmptyState,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderStatusChip,
} from '../../components/provider/provider-ui';


const TABS: { label: string; value: string }[] = [
  { label: 'Tất cả', value: '' },
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: 'Đã nhận / Đang đến', value: 'ACCEPTED' },
  { label: 'Đã báo giá', value: 'QUOTED' },
  { label: 'Đang thực hiện', value: 'IN_PROGRESS' },
  { label: 'Hoàn thành', value: 'DONE' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

const getStatusColor = (status: string, activeColors: typeof Colors.light | typeof Colors.dark): string => {
  const map: Record<string, string> = {
    PENDING: activeColors.statusPending,
    ACCEPTED: activeColors.statusAccepted,
    QUOTED: activeColors.statusQuoted,
    CONFIRMED: activeColors.statusConfirmed,
    IN_PROGRESS: activeColors.statusInProgress,
    DONE: activeColors.statusDone,
    CANCELLED: activeColors.statusCancelled,
    DISPUTED: activeColors.statusDisputed,
  };
  return map[status] || activeColors.textSecondary;
};

export default function BookingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ status?: string }>();
  const bookingSignal = useNotificationStore((state) => state.bookingSignal);
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  const [activeTab, setActiveTab] = useState(params.status || '');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof params.status === 'string') setActiveTab(params.status);
  }, [params.status]);

  const fetchBookings = useCallback(
    async (nextPage = 1, reset = false) => {
      setError('');
      try {
        if (nextPage === 1) {
          setIsFetching(true);
          if (reset) {
            // Keep old data while fetching, just show spinner
            // We rely on isFetching to show the top spinner
          } else {
             // Initial load without reset
          }
        }
        const res = await bookingApi.getMyBookings({
          status: activeTab || undefined,
          page: nextPage,
          limit: 15,
        });
        const data = res.data?.data || [];
        const meta = res.data?.meta;

        if (reset || nextPage === 1) setBookings(data);
        else setBookings((prev) => [...prev, ...data]);

        setHasMore(meta ? nextPage < meta.totalPages : data.length === 15);
        setPage(nextPage);
      } catch {
        setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
      } finally {
        setLoading(false);
        setIsFetching(false);
      }
    },
    [activeTab],
  );

  useFocusEffect(
    useCallback(() => {
      fetchBookings(1, true);
    }, [fetchBookings])
  );

  useFocusEffect(
    useCallback(() => {
      if (bookingSignal) {
        void fetchBookings(1, true);
      }
    }, [bookingSignal, fetchBookings])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookings(1, true);
    setRefreshing(false);
  }, [fetchBookings]);

  const onEndReached = useCallback(() => {
    if (!loading && hasMore) fetchBookings(page + 1);
  }, [loading, hasMore, page, fetchBookings]);

  const filteredBookings = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return bookings;
    return bookings.filter((booking) => {
      const text = [
        booking.bookingCode,
        booking.service?.name,
        booking.customer?.fullName,
        booking.district,
        booking.province,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(keyword);
    });
  }, [bookings, search]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);

  const renderBooking = ({ item }: { item: any }) => {
    const color = getStatusColor(item.status, activeColors);
    return (
      <ProviderCard
        style={styles.bookingCard}
        onPress={() => router.push(routes.booking.detail(String(item.id)))}
        accessibilityLabel={`Mở đơn hàng ${item.bookingCode}`}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="labelSmall" style={[styles.bookingCode, { color: theme.colors.primary }]} selectable>
              #{item.bookingCode}
            </Text>
            <Text
              variant="titleSmall"
              style={[styles.bookingTitle, { color: theme.colors.onSurface }]}
              numberOfLines={1}
            >
              {item.service?.name || 'Dịch vụ'}
            </Text>
          </View>
          <ProviderStatusChip
            label={
              BOOKING_STATUS_LABEL[item.status as BookingStatus] || item.status
            }
            color={color}
          />
        </View>

        <InfoRow icon="account-outline" text={item.customer?.fullName || '—'} />
        <InfoRow
          icon="map-marker-outline"
          text={[item.district, item.province].filter(Boolean).filter(p => p !== 'Không áp dụng').join(', ') || '—'}
        />

        <View style={[styles.cardFooter, { borderTopColor: theme.colors.outlineVariant }]}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons
              name="calendar-clock-outline"
              size={14}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="labelSmall" style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>
              {item.desiredTime
                ? new Date(item.desiredTime).toLocaleDateString('vi-VN')
                : 'Chưa có lịch'}
            </Text>
          </View>
          {item.quotation && (
            <Text variant="labelMedium" style={[styles.price, { color: theme.colors.primary }]} selectable>
              {formatPrice(Number(item.quotation.actualPrice))}
            </Text>
          )}
        </View>
      </ProviderCard>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlashList
        data={filteredBookings}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBooking}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[activeColors.primary]}
          />
        }
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <ProviderPageHeader
              title="Đơn hàng"
              subtitle="Theo dõi và xử lý các yêu cầu dịch vụ."
            />

            {error && <ProviderInlineMessage tone="error" message={error} />}

            {isFetching && bookings.length > 0 && !refreshing && (
              <ActivityIndicator style={{ marginBottom: 10 }} size="small" color={activeColors.primary} />
            )}

            <Searchbar
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm mã đơn, khách hàng, dịch vụ…"
              style={[styles.search, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}
              inputStyle={styles.searchInput}
              iconColor={theme.colors.onSurfaceVariant}
              accessibilityLabel="Tìm kiếm đơn hàng"
            />

            <FlatList
              horizontal
              data={TABS}
              keyExtractor={(tab) => tab.value || 'all'}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabRow}
              renderItem={({ item: tab }) => (
                <ProviderStatusChip
                  label={tab.label}
                  selected={activeTab === tab.value}
                  color={
                    activeTab === tab.value
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant
                  }
                  onPress={() => setActiveTab(tab.value)}
                />
              )}
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              style={{ marginTop: 40 }}
              color={activeColors.primary}
            />
          ) : (
            <ProviderEmptyState
              icon="clipboard-text-off-outline"
              title={
                search ? 'Không tìm thấy đơn phù hợp' : 'Không có đơn hàng'
              }
              description={
                search
                  ? 'Thử từ khóa khác hoặc xóa bộ lọc tìm kiếm.'
                  : 'Đơn mới sẽ xuất hiện tại đây.'
              }
              actionLabel="Tải lại"
              onAction={() => fetchBookings(1, true)}
            />
          )
        }
        ListFooterComponent={
          hasMore && bookings.length > 0 ? (
            <ActivityIndicator
              style={{ paddingVertical: 16 }}
              color={activeColors.primary}
            />
          ) : null
        }
      />
    </View>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        name={icon}
        size={15}
        color={theme.colors.onSurfaceVariant}
      />
      <Text
        variant="bodySmall"
        style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}
        numberOfLines={1}
        selectable
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 112, gap: 10 },
  headerContent: { gap: 12, marginBottom: 2 },
  search: {
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: { fontSize: 14 },
  tabRow: { gap: 8, paddingVertical: 2 },
  bookingCard: { marginBottom: 0 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  bookingCode: { fontWeight: '700' },
  bookingTitle: { fontWeight: '700', marginTop: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 9 },
  infoText: { flex: 1 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center' },
  footerText: { marginLeft: 4 },
  price: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
