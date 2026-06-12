/**
 * Provider booking queue
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import {
  Text,
  Searchbar,
  ActivityIndicator,
  useTheme,
} from 'react-native-paper';
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
  { label: 'Đã báo giá', value: 'QUOTED' },
  { label: 'Đang thực hiện', value: 'IN_PROGRESS' },
  { label: 'Hoàn thành', value: 'DONE' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: Colors.light.statusPending,
    QUOTED: Colors.light.statusQuoted,
    CONFIRMED: Colors.light.statusConfirmed,
    IN_PROGRESS: Colors.light.statusInProgress,
    DONE: Colors.light.statusDone,
    CANCELLED: Colors.light.statusCancelled,
    DISPUTED: Colors.light.statusDisputed,
  };
  return map[status] || Colors.light.textSecondary;
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
        if (nextPage === 1) setLoading(true);
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
      }
    },
    [activeTab],
  );

  useEffect(() => {
    fetchBookings(1, true);
  }, [fetchBookings]);

  useEffect(() => {
    if (bookingSignal) {
      void fetchBookings(1, true);
    }
  }, [bookingSignal, fetchBookings]);

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
    const color = statusColor(item.status);
    return (
      <ProviderCard
        style={styles.bookingCard}
        onPress={() => router.push(routes.booking.detail(String(item.id)))}
        accessibilityLabel={`Mở đơn hàng ${item.bookingCode}`}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="labelSmall" style={styles.bookingCode} selectable>
              #{item.bookingCode}
            </Text>
            <Text
              variant="titleSmall"
              style={styles.bookingTitle}
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
          text={`${item.district || ''}, ${item.province || ''}`}
        />

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <MaterialCommunityIcons
              name="calendar-clock-outline"
              size={14}
              color={activeColors.textSecondary}
            />
            <Text variant="labelSmall" style={styles.footerText}>
              {item.desiredTime
                ? new Date(item.desiredTime).toLocaleDateString('vi-VN')
                : 'Chưa có lịch'}
            </Text>
          </View>
          {item.quotation && (
            <Text variant="labelMedium" style={styles.price} selectable>
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

            <Searchbar
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm mã đơn, khách hàng, dịch vụ…"
              style={styles.search}
              inputStyle={styles.searchInput}
              iconColor={activeColors.textSecondary}
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
                      ? Colors.light.primary
                      : activeColors.textSecondary
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
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        name={icon}
        size={15}
        color={Colors.light.textSecondary}
      />
      <Text
        variant="bodySmall"
        style={styles.infoText}
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
  bookingCode: { color: Colors.light.primary, fontWeight: '700' },
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
    color: Colors.light.primary,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
