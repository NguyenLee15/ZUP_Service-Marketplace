import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomerCard } from '../../../components/customer/customer-ui';
import { useActiveColors } from '../../../hooks/useActiveColors';
import { formatCurrency } from '../../../lib/format';

type BookingConfirmationSectionProps = {
  referencePrice?: number | string | null;
  submitting: boolean;
  disabled: boolean;
  onSubmit: () => void;
};

export function BookingConfirmationSection({ referencePrice, submitting, disabled, onSubmit }: BookingConfirmationSectionProps) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);

  return (
    <CustomerCard>
      <View style={styles.formBlock}>
        <Text variant="bodySmall" style={styles.subtitle}>Đơn sẽ được gửi đến nhà cung cấp để xác nhận và báo giá nếu cần.</Text>
        {referencePrice ? (
          <View style={styles.priceSummaryRow}>
            <MaterialCommunityIcons name="tag-outline" size={16} color={activeColors.primary} />
            <Text variant="labelMedium" style={styles.priceSummaryText}>Giá tham khảo: {formatCurrency(referencePrice)}</Text>
          </View>
        ) : null}
        <Button mode="contained" icon="check-circle-outline" loading={submitting} disabled={disabled} onPress={onSubmit} style={styles.submitButton} contentStyle={styles.submitContent}>
          Xác nhận đặt dịch vụ
        </Button>
      </View>
    </CustomerCard>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  formBlock: { gap: 12 },
  subtitle: { color: activeColors.textSecondary, lineHeight: 20 },
  priceSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceSummaryText: { color: activeColors.primary, fontWeight: '900' },
  submitButton: { borderRadius: 12 },
  submitContent: { minHeight: 52 },
});
