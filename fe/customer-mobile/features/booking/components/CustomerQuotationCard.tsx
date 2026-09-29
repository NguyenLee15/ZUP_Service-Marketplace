import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { CustomerCard } from '../../../components/customer/customer-ui';
import { useActiveColors } from '../../../hooks/useActiveColors';
import { formatCurrency } from '../../../lib/format';
import type { CustomerBookingDetail } from './customer-booking-detail.types';

export function CustomerQuotationCard({ booking, loading, onConfirm, onReject }: { booking: CustomerBookingDetail; loading: boolean; onConfirm: () => void; onReject: () => void }) {
  const colors = useActiveColors();
  const hasActualPrice = booking.actualPrice !== null && booking.actualPrice !== undefined;
  const quote = hasActualPrice ? booking.actualPrice : booking.quoteAmount;
  const priceLabel = hasActualPrice
    ? 'Chi phí thực tế'
    : booking.status === 'QUOTED'
      ? 'Báo giá chờ xác nhận'
      : 'Giá tạm tính';
  return (
    <CustomerCard style={[styles.card, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}>
      <View style={styles.content}>
        <Text variant="titleMedium" style={[styles.title, { color: colors.text }]}>{priceLabel} từ nhà cung cấp</Text>
        <Text variant="headlineSmall" style={[styles.amount, { color: colors.primary }]}>{quote ? formatCurrency(quote) : 'Đang chờ báo giá'}</Text>
        {booking.status === 'QUOTED' ? <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Chưa phải xác nhận thanh toán. Hãy kiểm tra hạng mục trước khi đồng ý báo giá.</Text> : null}
        {booking.estimatedTime ? <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Thời gian dự kiến: {booking.estimatedTime}</Text> : null}
        {booking.quoteNote || booking.note ? <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{booking.quoteNote || booking.note}</Text> : null}
        {booking.status === 'QUOTED' ? <View style={styles.actions}>
          <Button mode="contained" loading={loading} disabled={loading} onPress={onConfirm} style={styles.button}>Xác nhận</Button>
          <Button mode="outlined" disabled={loading} onPress={onReject} style={styles.button}>Từ chối</Button>
        </View> : null}
      </View>
    </CustomerCard>
  );
}

const styles = StyleSheet.create({ card: { borderWidth: 2 }, content: { gap: 10 }, title: { fontWeight: '900' }, amount: { fontWeight: '900' }, actions: { flexDirection: 'row', gap: 10 }, button: { flex: 1, borderRadius: 12 } });
