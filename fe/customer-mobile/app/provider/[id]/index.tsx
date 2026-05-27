import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, Button, Chip, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  CustomerCard,
  CustomerHeader,
  EmptyState,
  InlineMessage,
  LoadingState,
  StatusChip,
} from '../../../components/customer/customer-ui';
import { Colors } from '../../../constants/colors';
import { chatApi } from '../../../features/chat/chat.api';
import { serviceApi } from '../../../features/service/service.api';
import { normalizeList, unwrapData } from '../../../lib/api-response';
import { formatCurrency } from '../../../lib/format';
import { stableKey, toRouteId, routes } from '../../../lib/route-utils';

type ProviderProfile = {
  id?: number | string;
  fullName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  createdAt?: string | null;
  address?: {
    province?: string | null;
    district?: string | null;
    ward?: string | null;
    addressDetail?: string | null;
  } | null;
  stats?: {
    avgRating?: number | string | null;
    totalReviews?: number | string | null;
    totalServices?: number | string | null;
  } | null;
  metrics?: {
    avgResponseHours?: number | string | null;
    completionRate?: number | string | null;
    totalCompleted?: number | string | null;
    totalBookings?: number | string | null;
  } | null;
};

type ProviderService = {
  id?: number | string;
  name?: string | null;
  referencePrice?: number | string | null;
  avgRating?: number | string | null;
  totalReviews?: number | string | null;
  images?: Array<{ imageUrl?: string | null }> | null;
  category?: { name?: string | null } | null;
};

type SortOption = 'newest' | 'rating' | 'priceAsc' | 'priceDesc';

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'rating', label: 'Đánh giá cao' },
  { value: 'priceAsc', label: 'Giá thấp' },
  { value: 'priceDesc', label: 'Giá cao' },
];

function isValidProviderId(value: number) {
  return Number.isFinite(value) && value > 0;
}

function normalizeProviderServices(payload: unknown) {
  const data: any = unwrapData(payload);
  const list = Array.isArray(data?.list)
    ? data.list
    : Array.isArray(data?.data?.list)
      ? data.data.list
      : normalizeList<ProviderService>(payload);
  const pagination = data?.pagination || data?.data?.pagination || data?.meta || {};
  return {
    items: list as ProviderService[],
    total: Number(pagination.total ?? list.length),
  };
}

function getProviderAddress(provider?: ProviderProfile | null) {
  const address = provider?.address;
  return [address?.addressDetail, address?.ward, address?.district, address?.province]
    .filter(Boolean)
    .join(', ');
}

function formatMetric(value?: number | string | null, suffix = '') {
  if (value === null || value === undefined || value === '') return 'Chưa có dữ liệu';
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Chưa có dữ liệu';
  return `${number}${suffix}`;
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

function getAvatarLabel(name?: string | null) {
  return (name || 'N').trim().charAt(0).toUpperCase();
}

export default function ProviderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const providerId = Number(id);
  const validProviderId = isValidProviderId(providerId);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [chatLoadingId, setChatLoadingId] = useState<string | number | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const profileQuery = useQuery({
    queryKey: ['provider', providerId, 'profile'],
    queryFn: async () => unwrapData<ProviderProfile>(await serviceApi.getProviderProfile(providerId)),
    enabled: validProviderId,
  });

  const servicesQuery = useQuery({
    queryKey: ['provider', providerId, 'services', debouncedSearch, sortBy],
    queryFn: async () =>
      normalizeProviderServices(
        await serviceApi.getProviderServices(providerId, {
          page: 1,
          limit: 20,
          search: debouncedSearch || undefined,
          sortBy,
        }),
      ),
    enabled: validProviderId,
  });

  const provider = profileQuery.data;
  const services = servicesQuery.data?.items || [];
  const servicesTotal = servicesQuery.data?.total || services.length;
  const showProfileFallback = profileQuery.isError && services.length > 0;

  const headerSubtitle = provider?.fullName || (showProfileFallback ? 'Thông tin nhà cung cấp chưa tải được' : undefined);
  const refreshing = profileQuery.isRefetching || servicesQuery.isRefetching;

  const refresh = () => {
    profileQuery.refetch();
    servicesQuery.refetch();
  };

  const openChat = async (service: ProviderService) => {
    const serviceId = Number(service.id);
    if (!Number.isFinite(serviceId) || serviceId <= 0) return;
    setActionMessage('');
    setChatLoadingId(service.id || serviceId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const response = await chatApi.getOrCreateConversation({ serviceId });
      const conversationId = getConversationId(response);
      if (!conversationId) throw new Error('Missing conversation id');
      router.push(routes.chatRoom(conversationId, provider?.fullName || 'Nhà cung cấp'));
    } catch {
      setActionMessage('Không thể mở tin nhắn với nhà cung cấp.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setChatLoadingId(null);
    }
  };

  if (!validProviderId) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="account-alert-outline"
          title="Nhà cung cấp không hợp lệ"
          description="Vui lòng quay lại trang dịch vụ và thử lại."
          actionLabel="Tìm dịch vụ"
          onAction={() => router.replace(routes.tabs.search)}
        />
      </View>
    );
  }

  if (profileQuery.isLoading && servicesQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <LoadingState label="Đang tải hồ sơ nhà cung cấp..." />
      </View>
    );
  }

  if (profileQuery.isError && services.length === 0 && !servicesQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="account-off-outline"
          title="Không tìm thấy nhà cung cấp"
          description="Nhà cung cấp có thể không tồn tại hoặc tài khoản đã bị khóa."
          actionLabel="Tìm dịch vụ khác"
          onAction={() => router.replace(routes.tabs.search)}
        />
      </View>
    );
  }

  return (
    <FlashList
      data={services}
      keyExtractor={(item: ProviderService, index) => stableKey(item.id, `provider-service-${index}`)}
      contentContainerStyle={styles.listContent}
      refreshing={refreshing}
      onRefresh={refresh}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <CustomerHeader title="Hồ sơ nhà cung cấp" subtitle={headerSubtitle} />
          {showProfileFallback ? (
            <InlineMessage tone="warning" message="Không thể tải đầy đủ hồ sơ, vẫn hiển thị dịch vụ đang có." />
          ) : null}
          {actionMessage ? <InlineMessage tone="error" message={actionMessage} /> : null}
          {provider ? <ProviderHero provider={provider} /> : null}
          {provider ? <StatsGrid provider={provider} /> : null}
          <ServicesHeader
            search={search}
            sortBy={sortBy}
            total={servicesTotal}
            loading={servicesQuery.isLoading}
            onSearchChange={setSearch}
            onSortChange={setSortBy}
          />
          {servicesQuery.isError ? (
            <InlineMessage tone="error" message="Không thể tải dịch vụ của nhà cung cấp." />
          ) : null}
          {servicesQuery.isLoading ? <ServiceListSkeleton /> : null}
        </View>
      }
      ListEmptyComponent={
        !servicesQuery.isLoading ? (
          <EmptyState
            icon="tools"
            title={debouncedSearch ? 'Không tìm thấy dịch vụ' : 'Chưa có dịch vụ'}
            description={debouncedSearch ? 'Thử đổi từ khóa hoặc bộ lọc sắp xếp.' : 'Nhà cung cấp chưa có dịch vụ đang hoạt động.'}
          />
        ) : null
      }
      renderItem={({ item }: { item: ProviderService }) => (
        <ProviderServiceCard
          service={item}
          chatLoading={String(chatLoadingId || '') === String(item.id || '')}
          onOpen={() => {
            const serviceId = toRouteId(item.id);
            if (!serviceId) return;
            router.push(routes.service(serviceId));
          }}
          onChat={() => openChat(item)}
          onBook={() => {
            const serviceId = toRouteId(item.id);
            if (!serviceId) return;
            router.push(routes.booking.create(serviceId));
          }}
        />
      )}
    />
  );
}

function ProviderHero({ provider }: { provider: ProviderProfile }) {
  const address = getProviderAddress(provider);
  const providerColor = useMemo(() => getAvatarColor(provider.fullName), [provider.fullName]);

  return (
    <CustomerCard style={styles.heroCard}>
      <View style={styles.heroRow}>
        {provider.avatarUrl ? (
          <View style={styles.avatarBorder}>
            <Avatar.Image size={66} source={{ uri: provider.avatarUrl }} />
          </View>
        ) : (
          <View style={[styles.providerAvatarCircle, { backgroundColor: providerColor }]}>
            <Text style={styles.providerAvatarText}>{getAvatarLabel(provider.fullName)}</Text>
          </View>
        )}
        <View style={styles.heroInfo}>
          <View style={styles.providerNameRow}>
            <Text variant="titleLarge" style={styles.providerName} numberOfLines={2}>
              {provider.fullName || 'Nhà cung cấp'}
            </Text>
            <View style={styles.verifiedBadge}>
              <MaterialCommunityIcons name="check-decagram" size={16} color={Colors.light.success} />
              <Text variant="labelSmall" style={styles.verifiedBadgeText}>Đã xác minh</Text>
            </View>
          </View>
          {provider.phone || provider.email ? (
            <View style={styles.contactRow}>
              <MaterialCommunityIcons name="phone-outline" size={14} color={Colors.light.textSecondary} />
              <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>
                {provider.phone || provider.email}
              </Text>
            </View>
          ) : null}
          {address ? (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={15} color={Colors.light.textSecondary} />
              <Text variant="bodySmall" style={styles.infoText} numberOfLines={2}>
                {address}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </CustomerCard>
  );
}

function StatsGrid({ provider }: { provider: ProviderProfile }) {
  const stats = provider.stats || {};
  const metrics = provider.metrics || {};

  return (
    <View style={styles.statsGrid}>
      <MetricCard icon="star" label="Đánh giá" value={formatMetric(stats.avgRating, '/5')} color="#FBBF24" />
      <MetricCard icon="comment-quote-outline" label="Lượt đánh giá" value={formatMetric(stats.totalReviews)} color={Colors.light.primary} />
      <MetricCard icon="briefcase-check-outline" label="Dịch vụ" value={formatMetric(stats.totalServices)} color={Colors.light.success} />
      <MetricCard icon="timer-outline" label="Phản hồi TB" value={formatMetric(metrics.avgResponseHours, 'h')} color={Colors.light.info} />
      <MetricCard icon="progress-check" label="Hoàn thành" value={formatMetric(metrics.completionRate, '%')} color="#7C3AED" />
      <MetricCard icon="check-decagram-outline" label="Đơn hoàn tất" value={formatMetric(metrics.totalCompleted)} color={Colors.light.success} />
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  value: string;
  color: string;
}) {
  return (
    <CustomerCard style={styles.metricCardOuter}>
      <View style={styles.metricContent}>
        <View style={[styles.metricIconWrap, { backgroundColor: `${color}18` }]}>
          <MaterialCommunityIcons name={icon} size={18} color={color} />
        </View>
        <Text variant="labelSmall" style={styles.metricLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text variant="titleMedium" style={styles.metricValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </CustomerCard>
  );
}

function ServicesHeader({
  search,
  sortBy,
  total,
  loading,
  onSearchChange,
  onSortChange,
}: {
  search: string;
  sortBy: SortOption;
  total: number;
  loading: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
}) {
  return (
    <View style={styles.servicesHeader}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Dịch vụ đang cung cấp
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            {loading ? 'Đang tải...' : `${total} dịch vụ`}
          </Text>
        </View>
      </View>
      <TextInput
        mode="outlined"
        label="Tìm trong dịch vụ của nhà cung cấp"
        value={search}
        onChangeText={onSearchChange}
        left={<TextInput.Icon icon="magnify" />}
        right={search ? <TextInput.Icon icon="close" onPress={() => onSearchChange('')} /> : undefined}
      />
      <View style={styles.chipRow}>
        {SORT_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            selected={sortBy === option.value}
            mode={sortBy === option.value ? 'flat' : 'outlined'}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onSortChange(option.value);
            }}
            style={styles.sortChip}
          >
            {option.label}
          </Chip>
        ))}
      </View>
    </View>
  );
}

function ProviderServiceCard({
  service,
  chatLoading,
  onOpen,
  onChat,
  onBook,
}: {
  service: ProviderService;
  chatLoading: boolean;
  onOpen: () => void;
  onChat: () => void;
  onBook: () => void;
}) {
  const imageUrl = service.images?.[0]?.imageUrl || null;
  const price = Number(service.referencePrice || 0);
  const rating = Number(service.avgRating || 0);

  return (
    <CustomerCard style={styles.serviceCardOuter}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Mở dịch vụ ${service.name || 'dịch vụ'}`}
        accessibilityHint="Xem chi tiết dịch vụ của nhà cung cấp"
        onPress={onOpen}
        style={styles.serviceContent}
        hitSlop={6}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.serviceImage} contentFit="cover" transition={160} />
        ) : (
          <View style={styles.imageFallback}>
            <MaterialCommunityIcons name="wrench-outline" size={28} color={Colors.light.primary} />
          </View>
        )}
        <View style={styles.serviceInfo}>
          <Text variant="titleMedium" style={styles.serviceTitle} numberOfLines={2}>
            {service.name || 'Dịch vụ'}
          </Text>
          <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>
            {service.category?.name || 'Dịch vụ nhà cung cấp'}
          </Text>

          <View style={styles.serviceMetaRow}>
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={14} color="#FBBF24" />
              <Text variant="labelSmall" style={styles.ratingBadgeText}>
                {rating.toFixed(1)}
              </Text>
            </View>
            <Text variant="bodySmall" style={styles.reviewCountText}>
              ({service.totalReviews || 0} đánh giá)
            </Text>
          </View>

          <Text variant="titleMedium" style={styles.priceText}>
            {price > 0 ? formatCurrency(price) : 'Liên hệ báo giá'}
          </Text>
        </View>
      </Pressable>

      <View style={styles.serviceDivider} />

      <View style={styles.actionRow}>
        <Button
          mode="outlined"
          icon="chat-outline"
          loading={chatLoading}
          disabled={chatLoading}
          onPress={onChat}
          style={styles.actionButton}
          contentStyle={styles.actionContent}
          accessibilityLabel={`Nhắn tin về dịch vụ ${service.name || ''}`}
        >
          Nhắn tin
        </Button>
        <Button
          mode="contained"
          icon="calendar-plus"
          onPress={onBook}
          style={styles.actionButton}
          contentStyle={styles.actionContent}
          accessibilityLabel={`Đặt lịch dịch vụ ${service.name || ''}`}
        >
          Đặt lịch
        </Button>
      </View>
    </CustomerCard>
  );
}

function ServiceListSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((item) => (
        <CustomerCard key={item}>
          <View style={styles.serviceContent}>
            <View style={[styles.skeleton, styles.serviceImage]} />
            <View style={styles.serviceInfo}>
              <View style={[styles.skeleton, { height: 18, width: '86%' }]} />
              <View style={[styles.skeleton, { height: 14, width: '62%' }]} />
              <View style={[styles.skeleton, { height: 14, width: '44%' }]} />
            </View>
          </View>
        </CustomerCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  listContent: { padding: 16, paddingBottom: 112 },
  headerWrap: { gap: 14, marginBottom: 12 },
  heroRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  heroInfo: { flex: 1, gap: 7 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  providerName: { color: Colors.light.text, fontWeight: '900', flex: 1 },
  subtitle: { color: Colors.light.textSecondary, lineHeight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  infoText: { flex: 1, color: Colors.light.textSecondary, lineHeight: 19 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metricCard: { width: '31%', minWidth: 104 },
  metricContent: { gap: 6, alignItems: 'center', justifyContent: 'center' },
  metricLabel: { color: Colors.light.textSecondary, fontWeight: '800' },
  metricValue: { color: Colors.light.text, fontWeight: '900' },
  servicesHeader: { gap: 10 },
  sectionTitle: { color: Colors.light.text, fontWeight: '900' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sortChip: { borderRadius: 999 },
  serviceContent: { flexDirection: 'row', gap: 12 },
  serviceImage: { width: 94, height: 94, borderRadius: 14, backgroundColor: Colors.light.surfaceVariant },
  imageFallback: {
    width: 94,
    height: 94,
    borderRadius: 14,
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: { flex: 1, gap: 5 },
  serviceTitle: { color: Colors.light.text, fontWeight: '900' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: Colors.light.textSecondary, fontWeight: '800' },
  priceText: { color: Colors.light.primary, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionButton: { flex: 1, borderRadius: 12 },
  skeletonWrap: { gap: 12 },
  skeleton: { backgroundColor: Colors.light.surfaceVariant, borderRadius: 10 },
  // Styled new components
  heroCard: { borderColor: Colors.light.border },
  avatarBorder: { borderWidth: 2, borderColor: Colors.light.primarySoft, borderRadius: 999, padding: 2 },
  providerAvatarCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 24 },
  providerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${Colors.light.success}15`,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  verifiedBadgeText: { color: Colors.light.success, fontSize: 10, fontWeight: '700' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metricCardOuter: { width: '31%', minWidth: 104, borderColor: Colors.light.border },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  serviceCardOuter: { borderColor: Colors.light.border },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${Colors.light.warning}18`,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingBadgeText: { color: '#D97706', fontSize: 11, fontWeight: '800' },
  reviewCountText: { color: Colors.light.textSecondary, fontSize: 12 },
  serviceDivider: { height: 1, backgroundColor: Colors.light.border, marginVertical: 8, opacity: 0.6 },
  actionContent: { minHeight: 44 },
});
