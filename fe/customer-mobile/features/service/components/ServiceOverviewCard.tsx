import { StyleSheet, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CustomerCard } from '../../../components/customer/customer-ui';
import { useActiveColors } from '../../../hooks/useActiveColors';
import { formatCurrency } from '../../../lib/format';

type ServiceOverview = {
  description?: string | null;
  referencePrice?: number | string | null;
  avgRating?: number | string | null;
  totalReviews?: number | string | null;
};

type ServiceOverviewCardProps = {
  service: ServiceOverview;
  hasReferencePrice: boolean;
  referencePrice: number;
  estimateLow: number;
  estimateHigh: number;
};

export function ServiceOverviewCard({
  service,
  hasReferencePrice,
  referencePrice,
  estimateLow,
  estimateHigh,
}: ServiceOverviewCardProps) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);

  return (
    <CustomerCard style={styles.infoCard}>
      <View style={styles.infoBlock}>
        <View style={styles.rowBetween}>
          <Text variant="titleLarge" style={styles.price}>
            {hasReferencePrice ? formatCurrency(referencePrice) : 'Liên hệ báo giá'}
          </Text>
          <View style={styles.ratingPill}>
            <MaterialCommunityIcons name="star" size={16} color={activeColors.warning} />
            <Text variant="labelMedium" style={styles.ratingText}>
              {Number(service.avgRating || 0).toFixed(1)}
            </Text>
          </View>
        </View>

        {hasReferencePrice ? (
          <View style={styles.estimateBox}>
            <MaterialCommunityIcons name="cash-multiple" size={16} color={activeColors.primary} />
            <Text variant="bodySmall" style={styles.estimateText}>
              Khoảng giá ước tính: {formatCurrency(estimateLow)} - {formatCurrency(estimateHigh)}
            </Text>
          </View>
        ) : null}

        <View style={styles.infoDivider} />
        <View style={styles.descriptionBlock}>
          <Text variant="labelSmall" style={styles.infoLabel}>Giới thiệu dịch vụ</Text>
          <Text variant="bodyMedium" style={styles.description}>
            {service.description || 'Chưa có mô tả'}
          </Text>
        </View>

        <View style={styles.infoDivider} />
        <View style={styles.rowBetween}>
          <Text variant="labelLarge" style={styles.metaText}>
            {Number(service.totalReviews || 0)} lượt đánh giá
          </Text>
          <Chip icon="check-circle-outline" mode="outlined" style={styles.serviceActiveChip}>
            Đang hoạt động
          </Chip>
        </View>
      </View>
    </CustomerCard>
  );
}

const getStyles = (activeColors: ReturnType<typeof useActiveColors>) =>
  StyleSheet.create({
    infoCard: { borderColor: activeColors.border },
    infoBlock: { gap: 10 },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    price: { color: activeColors.primary, fontWeight: '900' },
    ratingPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: activeColors.surfaceVariant,
    },
    ratingText: { color: activeColors.text, fontWeight: '900', fontVariant: ['tabular-nums'] },
    descriptionBlock: { gap: 4 },
    description: { color: activeColors.textSecondary, lineHeight: 22 },
    metaText: { color: activeColors.text, fontWeight: '800' },
    estimateBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: activeColors.primarySoft,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginTop: 4,
    },
    estimateText: { color: activeColors.primary, fontWeight: '700' },
    infoDivider: { height: 1, backgroundColor: activeColors.border, marginVertical: 8 },
    infoLabel: { color: activeColors.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
    serviceActiveChip: { borderRadius: 999, height: 32 },
  });
