import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useActiveColors } from '../../../hooks/useActiveColors';
import { CustomerCard, EmptyState, StatusChip } from '../../../components/customer/customer-ui';
import { formatCurrency } from '../../../lib/format';

type BookingService = {
  name?: string;
  referencePrice?: number | string | null;
  provider?: { fullName?: string | null } | null;
  category?: { name?: string | null } | null;
};

type BookingServiceSummaryProps = {
  service?: BookingService;
  isReorder: boolean;
  onSearchPress: () => void;
};

export function BookingServiceSummary({ service, isReorder, onSearchPress }: BookingServiceSummaryProps) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);

  if (!service) {
    return (
      <EmptyState
        icon="briefcase-search-outline"
        title="Không tìm thấy dịch vụ"
        description="Dịch vụ có thể đã ngừng hiển thị."
        actionLabel="Tìm dịch vụ khác"
        onAction={onSearchPress}
      />
    );
  }

  return (
    <CustomerCard>
      <View style={styles.serviceCard}>
        <View style={styles.serviceDetails}>
          <Text variant="titleMedium" style={styles.titleText}>
            {service.name || 'Dịch vụ'}
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            {service.provider?.fullName || service.category?.name || 'HomeServe'}
          </Text>
          {service.referencePrice ? (
            <Text variant="titleSmall" style={styles.priceText}>
              {formatCurrency(service.referencePrice)}
            </Text>
          ) : null}
        </View>
        {isReorder ? <StatusChip label="Đặt lại" color={activeColors.info} /> : null}
      </View>
    </CustomerCard>
  );
}

const getStyles = (activeColors: ReturnType<typeof useActiveColors>) =>
  StyleSheet.create({
    serviceCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    serviceDetails: { flex: 1, gap: 4 },
    titleText: { color: activeColors.text, fontWeight: '900' },
    subtitle: { color: activeColors.textSecondary, lineHeight: 20 },
    priceText: { color: activeColors.primary, fontWeight: '900' },
  });
