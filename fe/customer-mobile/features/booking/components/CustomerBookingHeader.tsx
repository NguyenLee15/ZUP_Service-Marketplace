import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { StatusChip } from '../../../components/customer/customer-ui';
import { BOOKING_STATUS_LABEL } from '../../../constants/booking-status';
import { useActiveColors } from '../../../hooks/useActiveColors';
import type { CustomerBookingDetail } from './customer-booking-detail.types';

export function CustomerBookingHeader({ booking, statusColor }: { booking: CustomerBookingDetail; statusColor: string }) {
  const colors = useActiveColors();
  const status = booking.status || 'PENDING';
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall" style={[styles.title, { color: colors.text }]}>Đơn #{booking.bookingCode || booking.id}</Text>
      <Text variant="bodyMedium" style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
        {booking.service?.name || 'Dịch vụ'}
      </Text>
      <View style={styles.status}><StatusChip label={BOOKING_STATUS_LABEL[status] || status} color={statusColor} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 5 },
  title: { fontWeight: '900' },
  subtitle: { lineHeight: 20 },
  status: { alignItems: 'flex-start', marginTop: 4 },
});
