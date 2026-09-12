/**
 * Service reviews list.
 */
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Text, useTheme } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { serviceApi } from '../../../features/service/service.api';
import { Colors } from '../../../constants/colors';
import {
  ProviderCard,
  ProviderEmptyState,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderScreen,
} from '../../../components/provider/provider-ui';

export default function ServiceReviewsScreen() {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const styles = getStyles(theme, activeColors);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [service, setService] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await serviceApi.getReviews(Number(id));
      setService(res.data?.data);
      setReviews(res.data?.data?.reviews || []);
    } catch {
      setMessage('Không thể tải đánh giá dịch vụ. Kéo xuống để thử lại.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setMessage(null);
    await fetchReviews();
    setRefreshing(false);
  }, [fetchReviews]);

  const renderStars = (rating: number) => (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(index => (
        <MaterialCommunityIcons
          key={index}
          name={index <= rating ? 'star' : index - 0.5 === rating ? 'star-half-full' : 'star-outline'}
          size={16}
          color={activeColors.warning}
        />
      ))}
    </View>
  );

  const renderReview = ({ item }: { item: any }) => (
    <ProviderCard style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Avatar.Text
          size={38}
          label={item.customer?.fullName?.charAt(0) || 'K'}
          style={styles.avatar}
          labelStyle={styles.avatarLabel}
        />
        <View style={styles.reviewInfo}>
          <Text variant="titleSmall" style={styles.customerName} numberOfLines={1}>
            {item.customer?.fullName || 'Khách hàng'}
          </Text>
          {renderStars(item.rating)}
        </View>
        <Text variant="labelSmall" style={styles.reviewDate}>
          {new Date(item.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
      <Text variant="bodyMedium" style={styles.comment}>
        {item.comment || 'Khách hàng không để lại nhận xét.'}
      </Text>
    </ProviderCard>
  );

  return (
    <ProviderScreen>
      <FlashList
        data={reviews}
        keyExtractor={item => String(item.id)}
        renderItem={renderReview}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[activeColors.primary]} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <ProviderPageHeader
              title={service?.name || 'Đánh giá dịch vụ'}
              subtitle={
                service
                  ? `Trung bình ${service.averageRating?.toFixed?.(1) || '0.0'} sao từ ${service.reviewCount || 0} đánh giá.`
                  : 'Theo dõi phản hồi của khách hàng.'
              }
              onBack={() => router.back()}
            />
            {message && <ProviderInlineMessage tone="error" message={message} />}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loading} color={theme.colors.primary} />
          ) : (
            <ProviderEmptyState
              icon="star-off-outline"
              title="Chưa có đánh giá"
              description="Khi khách hàng hoàn tất đánh giá, phản hồi sẽ xuất hiện tại đây."
            />
          )
        }
      />
    </ProviderScreen>
  );
}

const getStyles = (theme: any, activeColors: any) => StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 56,
  },
  headerStack: {
    gap: 12,
    marginBottom: 12,
  },
  reviewCard: {
    marginBottom: 10,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    backgroundColor: `${activeColors.primary}16`,
  },
  avatarLabel: {
    color: activeColors.primary,
    fontWeight: '800',
  },
  reviewInfo: {
    flex: 1,
    minWidth: 0,
  },
  customerName: {
    color: activeColors.text,
    fontWeight: '800',
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  reviewDate: {
    color: activeColors.textSecondary,
  },
  comment: {
    color: activeColors.text,
    lineHeight: 20,
    marginTop: 12,
  },
  loading: {
    marginTop: 40,
  },
});
