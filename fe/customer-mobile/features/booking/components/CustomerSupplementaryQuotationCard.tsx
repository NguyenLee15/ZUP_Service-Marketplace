import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { CustomerCard, StatusChip } from '../../../components/customer/customer-ui';
import { useActiveColors } from '../../../hooks/useActiveColors';
import { formatCurrency } from '../../../lib/format';
import type { QuotationDetail } from './customer-booking-detail.types';

export function CustomerSupplementaryQuotationCard({
  quotation,
  loading,
  onConfirm,
  onReject,
}: {
  quotation: QuotationDetail;
  loading: boolean;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const colors = useActiveColors();
  const isPending = quotation.status === 'PENDING';
  const isAccepted = quotation.status === 'ACCEPTED';

  const statusLabel = isAccepted
    ? 'Đã chấp thuận'
    : quotation.status === 'REJECTED'
      ? 'Đã từ chối'
      : 'Chờ bạn duyệt';

  const statusColor = isAccepted
    ? colors.success || '#10b981'
    : quotation.status === 'REJECTED'
      ? colors.error || '#ef4444'
      : colors.primary;

  return (
    <CustomerCard
      style={[
        styles.card,
        {
          borderColor: isPending ? colors.primary : colors.border || '#e5e7eb',
          backgroundColor: isPending ? colors.primarySoft : colors.surface,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text variant="titleMedium" style={[styles.title, { color: colors.text }]}>
            Báo giá phát sinh #{quotation.id}
          </Text>
          <StatusChip label={statusLabel} color={statusColor} />
        </View>

        <Text variant="headlineSmall" style={[styles.amount, { color: colors.primary }]}>
          {formatCurrency(quotation.actualPrice)}
        </Text>

        {quotation.estimatedTime ? (
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            Thời gian dự kiến: {quotation.estimatedTime}
          </Text>
        ) : null}

        {quotation.note ? (
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            Lý do/Ghi chú: {quotation.note}
          </Text>
        ) : null}

        {quotation.quotationItems && quotation.quotationItems.length > 0 ? (
          <View style={[styles.itemsTable, { borderColor: colors.border || '#e5e7eb' }]}>
            {quotation.quotationItems.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text variant="bodySmall" style={[styles.itemName, { color: colors.text }]}>
                  {item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}
                </Text>
                <Text variant="bodySmall" style={[styles.itemPrice, { color: colors.text }]}>
                  {formatCurrency(item.price)}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {isPending ? (
          <View style={styles.actions}>
            <Button
              mode="contained"
              loading={loading}
              disabled={loading}
              onPress={onConfirm}
              style={styles.button}
            >
              Đồng ý phát sinh
            </Button>
            <Button
              mode="outlined"
              disabled={loading}
              onPress={onReject}
              style={styles.button}
            >
              Từ chối
            </Button>
          </View>
        ) : null}
      </View>
    </CustomerCard>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1.5 },
  content: { gap: 10 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontWeight: '900', flex: 1 },
  amount: { fontWeight: '900' },
  itemsTable: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemName: { flex: 1 },
  itemPrice: { fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  button: { flex: 1, borderRadius: 12 },
});

