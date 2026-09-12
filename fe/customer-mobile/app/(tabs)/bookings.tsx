import { useActiveColors } from '../../hooks/useActiveColors';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Button, Chip, Text, useTheme } from 'react-native-paper';
import {
  CustomerCard,
  CustomerHeader,
  EmptyState,
  InlineMessage,
  BookingCard,
} from '../../components/customer/customer-ui';
import { BOOKING_STATUS_LABEL, getBookingStatusColor } from '../../constants/booking-status';
import { Colors } from '../../constants/colors';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { stableKey, toRouteId, routes } from '../../lib/route-utils';
import { useBookingsList } from '../../features/booking/hooks/useBookingsList';
import { exportBookingHistoryPdf } from '../../lib/customer-pdf-export';

const FILTERS = [
  'ALL',
  'PENDING',
  'ACCEPTED',
  'QUOTED',
  'CONFIRMED',
  'IN_PROGRESS',
  'DONE',
  'CANCELLED',
  'DISPUTED',
];

function getFilterLabel(status: string) {
  return status === 'ALL' ? 'Tất cả' : BOOKING_STATUS_LABEL[status] || status;
}

function getEmptyState(status: string) {
  if (status === 'ALL') {
    return {
      title: 'Chưa có đơn hàng',
      description: 'Đơn mới sẽ xuất hiện sau khi bạn đặt dịch vụ.',
      actionLabel: 'Tìm dịch vụ',
    };
  }
  return {
    title: 'Không có đơn ở trạng thái này',
    description: 'Bạn có thể xem tất cả đơn hàng hoặc chọn trạng thái khác.',
    actionLabel: 'Xem tất cả',
  };
}

export default function BookingsScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const {
    status,
    setStatus,
    bookings,
    isInitialLoading,
    isRefetching,
    isError,
    refresh,
    openSearch,
  } = useBookingsList();
  const [exportingPdf, setExportingPdf] = useState(false);
  const [message, setMessage] = useState('');

  const empty = getEmptyState(status);
  const data = isInitialLoading
    ? [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }]
    : bookings;
  const handleExportPdf = async () => {
    setMessage('');
    setExportingPdf(true);
    try {
      await exportBookingHistoryPdf({ bookings, filters: { status } });
      setMessage('Đã tạo báo cáo PDF lịch sử đặt dịch vụ.');
    } catch {
      setMessage('Không thể xuất báo cáo PDF. Vui lòng thử lại sau.');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <FlashList
      data={data}
      keyExtractor={(item: any, index) => stableKey(item.id, `booking-${index}`)}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshing={isRefetching}
      onRefresh={refresh}
      ListHeaderComponent={
        <View style={styles.headerContent}>
          <CustomerHeader
            title="Đơn hàng"
            subtitle="Theo dõi lịch hẹn, báo giá và tiến độ dịch vụ"
            action={
              <Button mode="contained" compact icon="plus" onPress={openSearch} style={styles.headerButton}>
                Đặt dịch vụ
              </Button>
            }
          />
          {isOnline === false ? (
            <InlineMessage tone="warning" message="Đang ngoại tuyến. Dữ liệu gần nhất vẫn được giữ lại nếu có." />
          ) : null}
          <StatusFilters status={status} onChange={setStatus} />
          <CustomerCard contentStyle={styles.exportCardContent}>
            <View style={styles.exportCopy}>
              <Text variant="titleSmall" style={styles.exportTitle}>
                Báo cáo lịch sử đặt dịch vụ
              </Text>
              <Text variant="bodySmall" style={styles.exportDescription}>
                Xuất các đơn đang hiển thị thành PDF để lưu hoặc chia sẻ khi cần.
              </Text>
            </View>
            <Button
              mode="outlined"
              icon="file-pdf-box"
              loading={exportingPdf}
              disabled={exportingPdf || isInitialLoading}
              onPress={handleExportPdf}
              style={styles.exportButton}
            >
              Xuất PDF
            </Button>
          </CustomerCard>
          {message ? (
            <InlineMessage
              tone={message.includes('Không') ? 'error' : 'success'}
              message={message}
            />
          ) : null}
          {isError ? (
            <View style={styles.errorBlock}>
              <InlineMessage tone="error" message="Không thể tải danh sách đơn hàng." />
              <Button mode="outlined" icon="refresh" onPress={refresh} style={styles.retryButton}>
                Thử lại
              </Button>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !isInitialLoading ? (
          <EmptyState
            icon="clipboard-text-outline"
            title={empty.title}
            description={empty.description}
            actionLabel={empty.actionLabel}
            onAction={status === 'ALL' ? openSearch : () => setStatus('ALL')}
          />
        ) : null
      }
      renderItem={({ item }: any) => {
        const bookingId = toRouteId(item.id);
        return isInitialLoading ? (
          <BookingSkeleton />
        ) : (
          <BookingCard
            booking={item}
            onPress={() => {
              if (!bookingId) return;
              Haptics.selectionAsync().catch(() => {});
              router.push(routes.booking.detail(bookingId));
            }}
          />
        );
      }}
    />
  );
}

function StatusFilters({
  status,
  onChange,
}: {
  status: string;
  onChange: (status: string) => void;
}) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const styles = getStyles(activeColors);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      {FILTERS.map((item) => {
        const selected = status === item;
        const color = item === 'ALL' ? activeColors.primary : getBookingStatusColor(item, activeColors);
        return (
          <Chip
            key={item}
            selected={selected}
            mode={selected ? 'flat' : 'outlined'}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              onChange(item);
            }}
            accessibilityLabel={`Lọc đơn hàng ${getFilterLabel(item)}`}
            style={[
              styles.filterChip,
              selected
                ? { backgroundColor: color, borderColor: color }
                : { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
            ]}
            textStyle={{
              color: selected ? '#FFFFFF' : theme.colors.onSurfaceVariant,
              fontWeight: selected ? '800' : '700',
              fontSize: 13,
            }}
          >
            {getFilterLabel(item)}
          </Chip>
        );
      })}
    </ScrollView>
  );
}

function BookingSkeleton() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <CustomerCard>
      <View style={styles.cardContent}>
        <View style={[styles.skeleton, { width: '30%', height: 12 }]} />
        <View style={[styles.skeleton, { width: '82%', height: 20 }]} />
        <View style={[styles.skeleton, { width: '64%', height: 14 }]} />
        <View style={[styles.skeleton, { width: '90%', height: 14 }]} />
      </View>
    </CustomerCard>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  content: { padding: 16, paddingBottom: 112 },
  headerContent: { gap: 14, marginBottom: 12 },
  headerButton: { borderRadius: 999 },
  separator: { height: 12 },
  filterRow: { gap: 8, paddingRight: 16, paddingBottom: 4 },
  filterChip: { borderRadius: 16, height: 34, justifyContent: 'center' },
  errorBlock: { gap: 8 },
  retryButton: { alignSelf: 'flex-start', borderRadius: 12 },
  exportCardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  exportCopy: { flex: 1, gap: 2 },
  exportTitle: { fontWeight: '900' },
  exportDescription: { lineHeight: 18 },
  exportButton: { borderRadius: 12 },
  cardContent: { gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  codeText: { color: activeColors.primary, fontWeight: '900' },
  serviceTitle: { color: activeColors.text, fontWeight: '900' },
  subtitle: { color: activeColors.textSecondary, lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: activeColors.textSecondary, flex: 1, lineHeight: 19 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  nextAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: activeColors.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  nextActionText: { flex: 1, fontWeight: '900' },
  priceText: { color: activeColors.primary, fontWeight: '900' },
  skeleton: { backgroundColor: activeColors.surfaceVariant, borderRadius: 10 },
});
