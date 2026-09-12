import { useActiveColors } from '../../../hooks/useActiveColors';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Avatar, Button, Chip, Text, IconButton } from 'react-native-paper';
import {
  BottomActionBar,
  CustomerCard,
  EmptyState,
  InlineMessage,
  SectionHeader,
} from '../../../components/customer/customer-ui';
import { Colors } from '../../../constants/colors';
import { chatApi } from '../../../features/chat/chat.api';
import { serviceApi } from '../../../features/service/service.api';
import { useServiceStore } from '../../../features/service/service.store';
import { formatCurrency, formatDateTime } from '../../../lib/format';
import { normalizeList, normalizePaginated, unwrapData } from '../../../lib/api-response';
import { toRouteId, routes } from '../../../lib/route-utils';

type ServiceImage = {
  id?: number | string;
  imageUrl?: string;
  url?: string;
};

type ReviewItem = {
  id?: number | string;
  rating?: number | string;
  comment?: string | null;
  createdAt?: string | null;
  customer?: {
    fullName?: string | null;
  } | null;
};

type ServiceDetail = {
  id?: number | string;
  name?: string;
  description?: string | null;
  referencePrice?: number | string | null;
  avgRating?: number | string | null;
  totalReviews?: number | string | null;
  images?: ServiceImage[];
  provider?: {
    id?: number | string;
    fullName?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    status?: string | null;
  } | null;
  category?: {
    name?: string | null;
  } | null;
  reviews?: ReviewItem[];
};

type ProviderStats = {
  avgResponseHours?: number | string | null;
  completionRate?: number | string | null;
  totalCompleted?: number | string | null;
};

type ServiceDetailData = {
  service: ServiceDetail | null;
  stats: ProviderStats | null;
  reviews: ReviewItem[];
  reviewsHasMore: boolean;
  reviewsTotal: number;
  partialError: boolean;
};

function getImages(service?: ServiceDetail | null) {
  return (service?.images || []).filter((image) => image?.imageUrl || image?.url);
}

function getProvider(service?: ServiceDetail | null) {
  return service?.provider || null;
}

function getReviewList(serviceReviews: ReviewItem[] | undefined, reviewsResponse: unknown) {
  const remoteReviews = normalizePaginated<ReviewItem>(reviewsResponse, 1);
  const fallbackReviews = Array.isArray(serviceReviews) ? serviceReviews : [];
  const items = remoteReviews.items.length > 0 ? remoteReviews.items : fallbackReviews;
  const total = Number(remoteReviews.total || items.length);
  return {
    items,
    hasMore: Boolean(remoteReviews.hasMore || total > items.length),
    total,
  };
}

function getConversationId(payload: unknown) {
  const data: any = unwrapData(payload);
  return data?.id ?? data?.conversation?.id ?? data?.data?.id ?? data?.data?.conversation?.id;
}

function getAvatarColor(name?: string | null) {
  const colors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#8B5CF6', // Purple
    '#F59E0B', // Orange
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#EF4444', // Red
    '#6366F1', // Indigo
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

function getInitial(name?: string | null) {
  return (name || 'N').trim().charAt(0).toUpperCase();
}

function formatStatValue(value: unknown, suffix = '') {
  if (value === null || value === undefined || value === '') return 'N/A';
  return `${value}${suffix}`;
}

function isValidId(value: number) {
  return Number.isFinite(value) && value > 0;
}

export default function ServiceDetailScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const serviceId = Number(id);
  const validServiceId = isValidId(serviceId);
  const [imageIndex, setImageIndex] = useState(0);
  const [chatError, setChatError] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const favoriteServices = useServiceStore((state) => state.favoriteServices);
  const toggleFavorite = useServiceStore((state) => state.toggleFavorite);
  const isFavorite = favoriteServices.some((s) => s.id === serviceId);

  const detailQuery = useQuery({
    queryKey: ['service', serviceId, 'detail'],
    enabled: validServiceId,
    queryFn: async (): Promise<ServiceDetailData> => {
      const [serviceResult, statsResult, reviewsResult] = await Promise.allSettled([
        serviceApi.getById(serviceId),
        serviceApi.getProviderStats(serviceId),
        serviceApi.getReviews(serviceId, { page: 1, limit: 5 }),
      ]);

      const service =
        serviceResult.status === 'fulfilled'
          ? unwrapData<ServiceDetail>(serviceResult.value)
          : null;
      const reviews = getReviewList(
        service?.reviews,
        reviewsResult.status === 'fulfilled' ? reviewsResult.value : null,
      );

      return {
        service,
        stats:
          statsResult.status === 'fulfilled'
            ? unwrapData<ProviderStats>(statsResult.value)
            : null,
        reviews: reviews.items,
        reviewsHasMore: reviews.hasMore,
        reviewsTotal: reviews.total,
        partialError:
          serviceResult.status === 'rejected' ||
          statsResult.status === 'rejected' ||
          reviewsResult.status === 'rejected',
      };
    },
  });

  const service = detailQuery.data?.service;
  const stats = detailQuery.data?.stats;
  const reviews = detailQuery.data?.reviews || [];
  const provider = getProvider(service);
  const images = useMemo(() => getImages(service), [service]);
  const selectedImage = images[imageIndex] || images[0];
  const referencePrice = Number(service?.referencePrice || 0);
  const hasReferencePrice = Number.isFinite(referencePrice) && referencePrice > 0;
  const estimateLow = referencePrice * 0.9;
  const estimateHigh = referencePrice * 1.1;

  const startChat = async () => {
    if (!validServiceId) return;
    setChatError('');
    setChatLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const res = await chatApi.getOrCreateConversation({ serviceId });
      const conversationId = toRouteId(getConversationId(res));
      if (!conversationId) throw new Error('Missing conversation id');
      router.push({
        pathname: routes.chatRoom(conversationId).pathname,
        params: { providerName: provider?.fullName || 'Nhà cung cấp' },
      });
    } catch {
      setChatError('Không thể mở cuộc trò chuyện. Vui lòng thử lại.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setChatLoading(false);
    }
  };

  const createBooking = () => {
    if (!validServiceId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const nextServiceId = toRouteId(serviceId);
    if (!nextServiceId) return;
    router.push(routes.booking.create(nextServiceId));
  };

  if (!validServiceId) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="alert-circle-outline"
          title="Dịch vụ không hợp lệ"
          description="Vui lòng quay lại danh sách và chọn một dịch vụ khác."
          actionLabel="Tìm dịch vụ"
          onAction={() => router.replace(routes.tabs.search)}
        />
      </View>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <DetailSkeleton />
      </ScrollView>
    );
  }

  if (detailQuery.isError || !service) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <InlineMessage tone="error" message="Không thể tải chi tiết dịch vụ." />
        <EmptyState
          icon="briefcase-search-outline"
          title="Không tìm thấy dịch vụ"
          description="Dịch vụ có thể đã ngừng hiển thị hoặc đường dẫn không còn hợp lệ."
          actionLabel="Quay lại tìm kiếm"
          onAction={() => router.replace(routes.tabs.search)}
        />
        <Button mode="outlined" icon="refresh" onPress={() => detailQuery.refetch()} style={styles.retryButton}>
          Thử lại
        </Button>
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon={isFavorite ? 'cards-heart' : 'cards-heart-outline'}
              iconColor={isFavorite ? activeColors.error : activeColors.textSecondary}
              size={24}
              onPress={() => {
                if (service) {
                  Haptics.selectionAsync().catch(() => {});
                  toggleFavorite({
                    id: Number(service.id),
                    name: service.name || '',
                    referencePrice: service.referencePrice as number,
                    avgRating: service.avgRating as number,
                    totalReviews: service.totalReviews as number,
                    images: service.images as any[],
                    provider: service.provider as any,
                    category: service.category as any,
                  });
                }
              }}
            />
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.contentWithBottomBar}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl refreshing={detailQuery.isRefetching} onRefresh={() => detailQuery.refetch()} />
        }
      >
        <View style={styles.titleBlock}>
          <Text variant="headlineSmall" style={styles.title}>
            {service.name || 'Dịch vụ'}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {service.category?.name || 'HomeServe'}
          </Text>
        </View>

        <Gallery
          images={images}
          selectedImage={selectedImage}
          imageIndex={imageIndex}
          onSelect={(index) => {
            setImageIndex(index);
            Haptics.selectionAsync().catch(() => {});
          }}
        />

        {detailQuery.data?.partialError ? (
          <InlineMessage tone="warning" message="Một số dữ liệu phụ chưa tải được. Kéo xuống để thử lại." />
        ) : null}
        {chatError ? <InlineMessage tone="error" message={chatError} /> : null}

        <CustomerCard style={styles.infoCard}>
          <View style={styles.infoBlock}>
            <View style={styles.rowBetween}>
              <Text variant="titleLarge" style={styles.price}>
                {hasReferencePrice ? formatCurrency(referencePrice) : 'Liên hệ báo giá'}
              </Text>
              <View style={styles.ratingPill}>
                <MaterialCommunityIcons name="star" size={16} color="#FBBF24" />
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

            <View style={{ gap: 4 }}>
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

        <ProviderCard
          provider={provider}
          stats={stats}
          onPress={() => {
            if (!provider?.id) return;
            Haptics.selectionAsync().catch(() => {});
            const providerId = toRouteId(provider.id);
            if (!providerId) return;
            router.push(routes.provider(providerId));
          }}
        />

        <View style={styles.section}>
          <SectionHeader
            title="Đánh giá gần đây"
            subtitle={detailQuery.data?.reviewsTotal ? `${detailQuery.data.reviewsTotal} đánh giá` : undefined}
            actionLabel={detailQuery.data?.reviewsHasMore ? 'Xem thêm' : undefined}
            onAction={detailQuery.data?.reviewsHasMore ? () => detailQuery.refetch() : undefined}
          />
          {reviews.length === 0 ? (
            <EmptyState icon="star-outline" title="Chưa có đánh giá" description="Hãy là khách hàng đầu tiên đánh giá dịch vụ này." />
          ) : (
            reviews.slice(0, 5).map((review, index) => (
              <ReviewCard key={String(review.id || `review-${index}`)} review={review} />
            ))
          )}
        </View>
      </ScrollView>

      <BottomActionBar>
        <Button
          mode="outlined"
          onPress={startChat}
          loading={chatLoading}
          disabled={chatLoading}
          icon="chat-outline"
          style={styles.bottomButton}
        >
          Nhắn tin
        </Button>
        <Button
          mode="contained"
          onPress={createBooking}
          disabled={!validServiceId}
          icon="calendar-plus"
          style={styles.bottomButton}
        >
          Đặt lịch
        </Button>
      </BottomActionBar>
    </View>
  );
}

function Gallery({
  images,
  selectedImage,
  imageIndex,
  onSelect,
}: {
  images: ServiceImage[];
  selectedImage?: ServiceImage;
  imageIndex: number;
  onSelect: (index: number) => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  if (images.length === 0) {
    return (
      <View style={styles.galleryFallback}>
        <MaterialCommunityIcons name="image-off-outline" size={42} color={activeColors.primary} />
        <Text variant="bodyMedium" style={styles.subtitle}>
          Dịch vụ chưa có ảnh minh họa
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.gallery}>
      <View>
        <Image
          source={{ uri: selectedImage?.imageUrl || selectedImage?.url }}
          style={styles.mainImage}
          contentFit="cover"
          transition={180}
        />
        {images.length > 1 ? (
          <View style={styles.imageCounter}>
            <Text variant="labelSmall" style={styles.imageCounterText}>
              {imageIndex + 1}/{images.length}
            </Text>
          </View>
        ) : null}
      </View>
      {images.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailRow}>
          {images.map((image, index) => {
            const selected = index === imageIndex;
            return (
              <Pressable
                key={String(image.id || image.imageUrl || image.url || index)}
                onPress={() => onSelect(index)}
                accessibilityRole="button"
                accessibilityLabel={`Xem ảnh ${index + 1}`}
              >
                <Image
                  source={{ uri: image.imageUrl || image.url }}
                  style={[styles.thumbnail, selected && styles.thumbnailSelected]}
                  contentFit="cover"
                  transition={120}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
    </View>
  );
}

function ProviderCard({
  provider,
  stats,
  onPress,
}: {
  provider: ServiceDetail['provider'];
  stats?: ProviderStats | null;
  onPress: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const providerColor = useMemo(() => getAvatarColor(provider?.fullName), [provider?.fullName]);

  return (
    <CustomerCard onPress={provider?.id ? onPress : undefined} accessibilityLabel="Xem hồ sơ nhà cung cấp">
      <View style={styles.providerCard}>
        {provider?.avatarUrl ? (
          <Avatar.Image size={58} source={{ uri: provider.avatarUrl }} />
        ) : (
          <View style={[styles.providerAvatarCircle, { backgroundColor: providerColor }]}>
            <Text style={styles.providerAvatarText}>{getInitial(provider?.fullName)}</Text>
          </View>
        )}
        <View style={styles.providerInfo}>
          <View style={styles.providerNameRow}>
            <Text variant="titleMedium" style={styles.providerName} numberOfLines={1}>
              {provider?.fullName || 'Nhà cung cấp'}
            </Text>
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={activeColors.success} />
              <Text variant="labelSmall" style={styles.verifiedBadgeText}>Đã xác minh</Text>
            </View>
          </View>
          <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>
            {provider?.phone || 'Đã xác minh trên HomeServe'}
          </Text>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <StatItem label="Phản hồi" value={formatStatValue(stats?.avgResponseHours, 'h')} />
            <View style={styles.verticalDivider} />
            <StatItem label="Hoàn thành" value={formatStatValue(stats?.completionRate, '%')} />
            <View style={styles.verticalDivider} />
            <StatItem label="Đơn xong" value={formatStatValue(stats?.totalCompleted)} />
          </View>
        </View>
        {provider?.id ? (
          <MaterialCommunityIcons name="chevron-right" size={24} color={activeColors.textSecondary} style={{ marginLeft: 4 }} />
        ) : null}
      </View>
    </CustomerCard>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.statItem}>
      <Text variant="labelSmall" style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text variant="labelSmall" style={styles.statLabel} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function ReviewCard({ review }: { review: ReviewItem }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const avatarColor = useMemo(() => getAvatarColor(review.customer?.fullName), [review.customer?.fullName]);
  const initials = useMemo(() => getInitial(review.customer?.fullName), [review.customer?.fullName]);

  return (
    <CustomerCard style={styles.reviewCardOuter}>
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <View style={[styles.reviewAvatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.reviewAvatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={styles.reviewName} numberOfLines={1}>
              {review.customer?.fullName || 'Khách hàng'}
            </Text>
            {review.createdAt ? (
              <Text variant="labelSmall" style={styles.subtitle}>
                {formatDateTime(review.createdAt)}
              </Text>
            ) : null}
          </View>
          <View style={styles.reviewRating}>
            <MaterialCommunityIcons name="star" size={15} color="#FBBF24" />
            <Text variant="labelSmall" style={styles.ratingText}>
              {Number(review.rating || 0).toFixed(1)}
            </Text>
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

function DetailSkeleton() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.skeletonScreen}>
      <View style={[styles.skeleton, { width: '74%', height: 28 }]} />
      <View style={[styles.skeleton, { width: '48%', height: 16 }]} />
      <View style={[styles.skeleton, styles.mainImage]} />
      <CustomerCard>
        <View style={styles.infoBlock}>
          <View style={[styles.skeleton, { width: '42%', height: 24 }]} />
          <View style={[styles.skeleton, { width: '88%', height: 16 }]} />
          <View style={[styles.skeleton, { width: '94%', height: 16 }]} />
        </View>
      </CustomerCard>
      <CustomerCard>
        <View style={[styles.skeleton, { width: '70%', height: 20 }]} />
      </CustomerCard>
    </View>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: activeColors.background },
  content: { padding: 16, paddingBottom: 112, gap: 16 },
  contentWithBottomBar: { padding: 16, paddingBottom: 144, gap: 16 },
  titleBlock: { gap: 4 },
  title: { color: activeColors.text, fontWeight: '900', lineHeight: 34 },
  subtitle: { color: activeColors.textSecondary, lineHeight: 19 },
  gallery: { gap: 10 },
  mainImage: { width: '100%', height: 250, borderRadius: 22, backgroundColor: activeColors.surfaceVariant },
  galleryFallback: {
    height: 220,
    borderRadius: 22,
    backgroundColor: activeColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  imageCounter: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
  },
  imageCounterText: { color: '#FFFFFF', fontWeight: '900', fontVariant: ['tabular-nums'] },
  thumbnailRow: { gap: 8, paddingRight: 16 },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: activeColors.surfaceVariant,
  },
  thumbnailSelected: { borderColor: activeColors.primary },
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
  description: { color: activeColors.textSecondary, lineHeight: 22 },
  metaText: { color: activeColors.text, fontWeight: '800' },
  providerCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  providerInfo: { flex: 1, gap: 4 },
  providerName: { color: activeColors.text, fontWeight: '900', marginRight: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statItem: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: activeColors.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  statValue: { color: activeColors.text, fontWeight: '900', textAlign: 'center', fontVariant: ['tabular-nums'] },
  statLabel: { color: activeColors.textSecondary, textAlign: 'center' },
  section: { gap: 10 },
  reviewCard: { gap: 8 },
  reviewName: { color: activeColors.text, fontWeight: '900', flex: 1 },
  reviewRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  retryButton: { borderRadius: 12, alignSelf: 'center' },
  bottomButton: { flex: 1, borderRadius: 12 },
  skeletonScreen: { gap: 14 },
  skeleton: { backgroundColor: activeColors.surfaceVariant, borderRadius: 12 },
  // Styled new components
  infoCard: { borderColor: activeColors.border },
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
  providerAvatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 20 },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${activeColors.success}15`,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  verifiedBadgeText: { color: activeColors.success, fontSize: 10, fontWeight: '700' },
  verticalDivider: { width: 1, height: 24, backgroundColor: activeColors.border, alignSelf: 'center' },
  divider: { height: 1, backgroundColor: activeColors.border, marginVertical: 4 },
  reviewCardOuter: { borderColor: activeColors.border },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  reviewDivider: { height: 1, backgroundColor: activeColors.border, marginVertical: 6, opacity: 0.6 },
});
