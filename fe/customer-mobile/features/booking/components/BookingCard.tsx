import { useActiveColors } from '../../../hooks/useActiveColors';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { BOOKING_STATUS_LABEL, getBookingStatusColor } from '../../../constants/booking-status';
import { formatCurrency, formatDateTime } from '../../../lib/format';

type BookingListItem = {
  id?: number | string;
  bookingCode?: string | null;
  status?: string | null;
  service?: { name?: string | null } | null;
  provider?: { fullName?: string | null } | null;
  desiredTime?: string | Date | null;
  province?: string | null;
  ward?: string | null;
  addressDetail?: string | null;
  quoteAmount?: number | string | null;
  actualPrice?: number | string | null;
};

const getStyles = (activeColors: any) => StyleSheet.create({
  card: {
    backgroundColor: activeColors.surface,
    borderColor: activeColors.border,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardContent: { padding: 16, gap: 10 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  codeText: { color: activeColors.primary, fontWeight: '900' },
  serviceTitle: { color: activeColors.text, fontWeight: '900' },
  chip: { borderRadius: 999 },
  subtitle: { color: activeColors.textSecondary, lineHeight: 19 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { color: activeColors.textSecondary, flex: 1, lineHeight: 19 },
  divider: { height: 1, backgroundColor: activeColors.border, marginVertical: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  ctaText: { fontWeight: '900', fontSize: 13 },
  priceText: { color: activeColors.primary, fontWeight: '900' },
});

export function StatusChip({
  label,
  color,
}: {
  label: string;
  color?: string;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const chipColor = color || activeColors.primary;
  return (
    <Chip compact style={[styles.chip, { backgroundColor: `${chipColor}16` }]} textStyle={{ color: chipColor }}>
      {label}
    </Chip>
  );
}

function getBookingPrice(booking: BookingListItem) {
  return booking.quoteAmount || booking.actualPrice || null;
}

type CtaConfig = {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  bgColor: string;
  textColor: string;
};

function getCtaConfig(status?: string | null, activeColors?: any): CtaConfig {
  switch (status) {
    case 'QUOTED':
      return { icon: 'check-circle-outline', label: 'Xem & xác nhận báo giá', bgColor: `${getBookingStatusColor('QUOTED', activeColors)}18`, textColor: getBookingStatusColor('QUOTED', activeColors) };
    case 'IN_PROGRESS':
      return { icon: 'progress-wrench', label: 'Đang thực hiện', bgColor: `${activeColors.success}15`, textColor: activeColors.success };
    case 'DONE':
      return { icon: 'star-check-outline', label: 'Xác nhận & đánh giá', bgColor: `${activeColors.primary}15`, textColor: activeColors.primary };
    case 'DISPUTED':
      return { icon: 'alert-octagon-outline', label: 'Đang tranh chấp', bgColor: `${activeColors.error}12`, textColor: activeColors.error };
    case 'CANCELLED':
      return { icon: 'close-circle-outline', label: 'Đơn đã hủy', bgColor: activeColors.surfaceVariant, textColor: activeColors.textSecondary };
    case 'PENDING':
      return { icon: 'clock-outline', label: 'Chờ nhà cung cấp xác nhận', bgColor: `${activeColors.warning}15`, textColor: activeColors.warning };
    case 'CONFIRMED':
      return { icon: 'calendar-check-outline', label: 'Lịch hẹn đã chốt', bgColor: `${getBookingStatusColor('CONFIRMED', activeColors)}15`, textColor: getBookingStatusColor('CONFIRMED', activeColors) };
    default:
      return { icon: 'arrow-right-circle-outline', label: 'Xem chi tiết đơn hàng', bgColor: activeColors.surfaceVariant, textColor: activeColors.textSecondary };
  }
}

export function BookingCard({
  booking,
  onPress,
}: {
  booking: BookingListItem;
  onPress: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const status = booking.status || 'PENDING';
  const statusColor = getBookingStatusColor(status, activeColors);
  const price = getBookingPrice(booking);
  const address = [booking.addressDetail, booking.ward, booking.province].filter(Boolean).filter(p => p !== 'Không áp dụng').join(', ');
  const cta = getCtaConfig(status, activeColors);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Mở đơn hàng ${booking.bookingCode || booking.id || ''}`}
      accessibilityHint="Xem chi tiết và thao tác với đơn hàng"
      hitSlop={6}
    >
      <Card mode="contained" style={styles.card}>
        <Card.Content style={styles.cardContent}>
          {/* Header: thông tin + badge trạng thái */}
          <View style={styles.cardHeader}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text variant="labelSmall" style={styles.codeText} selectable>
                #{booking.bookingCode || booking.id}
              </Text>
              <Text variant="titleMedium" style={styles.serviceTitle} numberOfLines={2}>
                {booking.service?.name || 'Dịch vụ'}
              </Text>
              {booking.provider?.fullName ? (
                <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>
                  Thợ: {booking.provider.fullName}
                </Text>
              ) : null}
            </View>
            <StatusChip label={BOOKING_STATUS_LABEL[status] || status} color={statusColor} />
          </View>

          {/* Meta: thời gian & địa chỉ */}
          <View style={styles.metaRow}>
            <MaterialCommunityIcons name="calendar-clock" size={15} color={activeColors.textSecondary} />
            <Text variant="bodySmall" style={styles.metaText} numberOfLines={1}>
              {formatDateTime(booking.desiredTime)}
            </Text>
          </View>

          {address ? (
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={15} color={activeColors.textSecondary} />
              <Text variant="bodySmall" style={styles.metaText} numberOfLines={1}>
                {address}
              </Text>
            </View>
          ) : null}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Footer: CTA + giá */}
          <View style={styles.cardFooter}>
            <View style={[styles.ctaButton, { backgroundColor: cta.bgColor }]}>
              <MaterialCommunityIcons name={cta.icon} size={16} color={cta.textColor} />
              <Text variant="labelMedium" style={[styles.ctaText, { color: cta.textColor }]} numberOfLines={1}>
                {cta.label}
              </Text>
            </View>
            {price ? (
              <Text variant="titleSmall" style={styles.priceText}>
                {formatCurrency(price)}
              </Text>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
}
