import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';

import { CustomerCard, EmptyState, InlineMessage, SectionHeader } from '../../../components/customer/customer-ui';
import { useActiveColors } from '../../../hooks/useActiveColors';
import { formatDateTime } from '../../../lib/format';

export type ServiceReview = {
  id?: number | string;
  rating?: number | string;
  comment?: string | null;
  createdAt?: string | null;
  customer?: { fullName?: string | null } | null;
};

type ServiceReviewsSectionProps = {
  reviews: ServiceReview[];
  total: number;
  hasMore: boolean;
  loadingMore: boolean;
  hasError: boolean;
  onLoadMore: () => void;
};

export function ServiceReviewsSection({
  reviews,
  total,
  hasMore,
  loadingMore,
  hasError,
  onLoadMore,
}: ServiceReviewsSectionProps) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);

  return (
    <View style={styles.section}>
      <SectionHeader
        title="Đánh giá gần đây"
        subtitle={total ? `${total} đánh giá` : undefined}
        actionLabel={hasMore ? (loadingMore ? 'Đang tải...' : 'Xem thêm') : undefined}
        onAction={hasMore ? onLoadMore : undefined}
      />
      {hasError ? <InlineMessage tone="warning" message="Không thể tải thêm đánh giá. Hãy thử lại." /> : null}
      {reviews.length === 0 ? (
        <EmptyState icon="star-outline" title="Chưa có đánh giá" description="Hãy là khách hàng đầu tiên đánh giá dịch vụ này." />
      ) : (
        reviews.map((review, index) => <ReviewCard key={String(review.id || `review-${index}`)} review={review} />)
      )}
    </View>
  );
}

function ReviewCard({ review }: { review: ServiceReview }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const name = review.customer?.fullName || 'Khách hàng';
  const avatarColor = getAvatarColor(name);
  const initials = name.trim().charAt(0).toUpperCase() || 'N';

  return (
    <CustomerCard style={styles.reviewCardOuter}>
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={[styles.reviewAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.reviewAvatarText}>{initials}</Text>
          </View>
          <View style={styles.reviewNameBlock}>
            <Text variant="titleSmall" style={styles.reviewName} numberOfLines={1}>
              {name}
            </Text>
            {review.createdAt ? <Text variant="labelSmall" style={styles.subtitle}>{formatDateTime(review.createdAt)}</Text> : null}
          </View>
          <View style={styles.reviewRating}>
            <MaterialCommunityIcons name="star" size={15} color={activeColors.warning} />
            <Text variant="labelSmall" style={styles.ratingText}>{Number(review.rating || 0).toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.reviewDivider} />
        <Text variant="bodySmall" style={styles.description}>
          {review.comment || 'Không có phản hồi dạng văn bản.'}
        </Text>
      </View>
    </CustomerCard>
  );
}

function getAvatarColor(name: string) {
  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#6366F1'];
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) hash = name.charCodeAt(index) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

const getStyles = (activeColors: ReturnType<typeof useActiveColors>) =>
  StyleSheet.create({
    section: { gap: 10 },
    reviewCardOuter: { borderColor: activeColors.border },
    reviewCard: { gap: 8 },
    reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    reviewAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    reviewAvatarText: { color: activeColors.onPrimary, fontWeight: '900' },
    reviewNameBlock: { flex: 1, gap: 2 },
    reviewName: { color: activeColors.text, fontWeight: '900' },
    subtitle: { color: activeColors.textSecondary, lineHeight: 19 },
    reviewRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    ratingText: { color: activeColors.text, fontWeight: '900', fontVariant: ['tabular-nums'] },
    reviewDivider: { height: 1, backgroundColor: activeColors.border },
    description: { color: activeColors.textSecondary, lineHeight: 22 },
  });
