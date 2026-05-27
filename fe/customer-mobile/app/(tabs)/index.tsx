import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Text, TouchableRipple } from 'react-native-paper';
import {
  CustomerCard,
  CustomerHeader,
  EmptyState,
  InlineMessage,
  SectionHeader,
  ServiceSkeleton,
} from '../../components/customer/customer-ui';
import { ServiceCard } from '../../features/service/components/ServiceCard';
import { CategorySection } from '../../features/service/components/CategoryGrid';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../features/auth/auth.store';
import { notificationApi } from '../../features/notification/notification.api';
import { serviceApi } from '../../features/service/service.api';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { normalizeList, unwrapData } from '../../lib/api-response';
import { stableKey, toRouteId, routes } from '../../lib/route-utils';

type HomeCategory = {
  id?: number | string;
  name?: string;
  icon?: string;
  children?: HomeCategory[];
};

type HomeService = {
  id?: number | string;
  name?: string;
  images?: Array<{ imageUrl?: string }>;
  provider?: { fullName?: string };
  category?: { name?: string };
  avgRating?: number | string;
  totalReviews?: number | string;
  referencePrice?: number | string;
};

type HomeData = {
  featured: HomeService[];
  popular: HomeService[];
  categories: HomeCategory[];
  failed: {
    featured: boolean;
    popular: boolean;
    categories: boolean;
  };
};

type UnreadResponse = {
  count?: number;
  unreadCount?: number;
  total?: number;
  hasUnread?: boolean;
};

const CATEGORY_LIMIT = 12;
const POPULAR_LIMIT = 6;

const SEARCH_PLACEHOLDERS = [
  'Tìm thợ sửa điện nước...',
  'Dịch vụ vệ sinh nhà cửa...',
  'Tìm thợ lắp máy lạnh...',
  'Tìm thợ sơn tường nhà...',
  'Sửa chữa đồ gia dụng...',
];

async function readHomeData(): Promise<HomeData> {
  const [featuredResult, categoriesResult, popularResult] = await Promise.allSettled([
    serviceApi.getFeatured(),
    serviceApi.getCategories(),
    serviceApi.search({ sort: 'rating', page: 1, limit: POPULAR_LIMIT }),
  ]);

  return {
    featured:
      featuredResult.status === 'fulfilled'
        ? normalizeList<HomeService>(featuredResult.value)
        : [],
    categories:
      categoriesResult.status === 'fulfilled'
        ? normalizeList<HomeCategory>(categoriesResult.value)
        : [],
    popular:
      popularResult.status === 'fulfilled'
        ? normalizeList<HomeService>(popularResult.value)
        : [],
    failed: {
      featured: featuredResult.status === 'rejected',
      categories: categoriesResult.status === 'rejected',
      popular: popularResult.status === 'rejected',
    },
  };
}

function getUnreadBadge(data?: UnreadResponse) {
  const rawCount = data?.count ?? data?.unreadCount ?? data?.total;
  const count = Number(rawCount);
  if (Number.isFinite(count) && count > 0) {
    return { label: count > 99 ? '99+' : String(count), showDot: false };
  }
  if (!Number.isFinite(count) && data?.hasUnread) {
    return { label: '', showDot: true };
  }
  return null;
}

function getHomeErrorMessage(failed?: HomeData['failed']) {
  if (!failed) return '';
  const failedCount = Object.values(failed).filter(Boolean).length;
  if (failedCount === 0) return '';
  if (failedCount === 3) return 'Không thể tải dữ liệu trang chủ. Kéo xuống để thử lại.';
  return 'Một số dữ liệu chưa tải được. Bạn vẫn có thể tìm dịch vụ hoặc hỏi AI.';
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isOnline = useNetworkStatus();
  const bellPulseAnim = useRef(new Animated.Value(0.4)).current;

  const homeQuery = useQuery({
    queryKey: ['customer-home'],
    queryFn: readHomeData,
    staleTime: 1000 * 60 * 3,
  });

  const unreadQuery = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => unwrapData<UnreadResponse>(await notificationApi.getUnread()),
    retry: 0,
    staleTime: 1000 * 60,
  });

  const featured = homeQuery.data?.featured || [];
  const popular = homeQuery.data?.popular || [];
  const categories = (homeQuery.data?.categories || []).slice(0, CATEGORY_LIMIT);
  const isInitialLoading = homeQuery.isLoading && !homeQuery.data;
  const homeErrorMessage = getHomeErrorMessage(homeQuery.data?.failed);
  const unreadBadge = getUnreadBadge(unreadQuery.data);

  useEffect(() => {
    if (unreadBadge) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(bellPulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(bellPulseAnim, {
            toValue: 0.4,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
  }, [unreadBadge]);

  const openSearch = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push(routes.tabs.search);
  };

  const openChatbot = () => {
    Haptics.selectionAsync().catch(() => {});
    router.push(routes.chatbot);
  };

  const refreshHome = () => {
    homeQuery.refetch();
    unreadQuery.refetch();
  };

  return (
    <FlashList
      data={(isInitialLoading ? [{ id: 'skeleton-1' }, { id: 'skeleton-2' }] : popular) as HomeService[]}
      keyExtractor={(item, index) => stableKey(item.id, `home-row-${index}`)}
      contentContainerStyle={styles.listContent}
      contentInsetAdjustmentBehavior="automatic"
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshing={homeQuery.isRefetching || unreadQuery.isRefetching}
      onRefresh={refreshHome}
      ListHeaderComponent={
        <View style={styles.headerContent}>
          <CustomerHeader
            title="Zup"
            subtitle={`Xin chào, ${user?.fullName || 'khách hàng'} 👋`}
            action={
              <TouchableRipple
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.push(routes.notifications);
                }}
                borderless
                style={styles.bellButton}
                accessibilityRole="button"
                accessibilityLabel="Mở thông báo"
              >
                <View>
                  <MaterialCommunityIcons name="bell-outline" size={24} color={Colors.light.text} />
                  {unreadBadge ? (
                    unreadBadge.label ? (
                      <Animated.View style={[styles.badge, { opacity: bellPulseAnim }]}>
                        <Text variant="labelSmall" style={styles.badgeText}>
                          {unreadBadge.label}
                        </Text>
                      </Animated.View>
                    ) : (
                      <Animated.View style={[styles.badgeDot, { opacity: bellPulseAnim }]} />
                    )
                  ) : null}
                </View>
              </TouchableRipple>
            }
          />

          {isOnline === false ? (
            <InlineMessage tone="warning" message="Đang ngoại tuyến. Dữ liệu gần nhất vẫn được giữ lại nếu có." />
          ) : null}

          {/* Fake Search Bar */}
          <FakeSearchBar onPress={openSearch} />

          {/* Hero Card */}
          <HomeHero loading={isInitialLoading} onSearch={openSearch} onChatbot={openChatbot} />

          {homeErrorMessage ? <InlineMessage tone="warning" message={homeErrorMessage} /> : null}

          <CategorySection
            categories={categories}
            loading={isInitialLoading}
            onOpenSearch={openSearch}
            onSelect={(category) => {
              Haptics.selectionAsync().catch(() => {});
              router.push({
                pathname: routes.tabs.search,
                params: { categoryId: category.id },
              });
            }}
          />

          <FeaturedSection
            services={featured}
            loading={isInitialLoading}
            onOpenSearch={openSearch}
            onOpenService={(service) => {
              const serviceId = toRouteId(service.id);
              if (!serviceId) return;
              router.push(routes.service(serviceId));
            }}
          />

          <SectionHeader
            title="Gợi ý phổ biến"
            subtitle="Các dịch vụ được đánh giá tốt"
            actionLabel="Xem thêm"
            onAction={openSearch}
          />
        </View>
      }
      ListEmptyComponent={
        !isInitialLoading ? (
          <EmptyState
            icon="magnify"
            title="Chưa có dịch vụ gợi ý"
            description="Bạn có thể tìm kiếm theo nhu cầu hoặc hỏi AI để được tư vấn nhanh."
            actionLabel="Tìm dịch vụ"
            onAction={openSearch}
          />
        ) : null
      }
      renderItem={({ item }) => {
        if (isInitialLoading) return <ServiceSkeleton />;
        return (
          <ServiceCard
            service={item}
            onPress={() => {
              const serviceId = toRouteId(item.id);
              if (!serviceId) return;
              router.push(routes.service(serviceId));
            }}
          />
        );
      }}
    />
  );
}

// ─── Fake Search Bar ─────────────────────────────────────────────────────────

function FakeSearchBar({ onPress }: { onPress: () => void }) {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      setPlaceholderIndex((i) => (i + 1) % SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel="Tìm kiếm dịch vụ"
      accessibilityHint="Tìm kiếm dịch vụ theo nhu cầu"
      style={({ pressed }) => [styles.fakeSearch, pressed && styles.fakeSearchPressed]}
    >
      <MaterialCommunityIcons name="magnify" size={20} color={Colors.light.primary} />
      <Animated.Text style={[styles.fakeSearchText, { opacity: fadeAnim }]} numberOfLines={1}>
        {SEARCH_PLACEHOLDERS[placeholderIndex]}
      </Animated.Text>
      <MaterialCommunityIcons name="tune-variant" size={18} color={Colors.light.textSecondary} />
    </Pressable>
  );
}

// ─── Home Hero ────────────────────────────────────────────────────────────────

function HomeHero({
  loading,
  onSearch,
  onChatbot,
}: {
  loading: boolean;
  onSearch: () => void;
  onChatbot: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    if (!loading) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 120,
      }).start();
    }
  }, [loading, scaleAnim]);

  if (loading) {
    return (
      <CustomerCard>
        <View style={styles.heroSkeleton}>
          <View style={[styles.skeletonBlock, { width: '72%', height: 24 }]} />
          <View style={[styles.skeletonBlock, { width: '94%', height: 16 }]} />
          <View style={[styles.skeletonBlock, { width: '58%', height: 44 }]} />
        </View>
      </CustomerCard>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      {/* Gradient Hero Card: blue primary → secondary teal */}
      <View style={styles.heroCard}>
        {/* Background decoration */}
        <View style={styles.heroBubble1} />
        <View style={styles.heroBubble2} />

        {/* Content */}
        <View style={styles.heroContent}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="home-search-outline" size={28} color="#FFFFFF" />
          </View>
          <View style={{ gap: 6, flex: 1 }}>
            <Text variant="titleLarge" style={styles.heroTitle}>
              Cần hỗ trợ việc nhà?
            </Text>
            <Text variant="bodyMedium" style={styles.heroText}>
              Tìm dịch vụ phù hợp, đặt lịch, chat và theo dõi đơn ngay trên điện thoại.
            </Text>
          </View>
        </View>

        <View style={styles.heroActions}>
          <Pressable
            onPress={() => { Haptics.selectionAsync().catch(() => {}); onSearch(); }}
            style={({ pressed }) => [styles.heroPrimaryBtn, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel="Tìm dịch vụ"
          >
            <MaterialCommunityIcons name="magnify" size={18} color={Colors.light.primary} />
            <Text style={styles.heroPrimaryBtnText}>Tìm dịch vụ</Text>
          </Pressable>
          <Pressable
            onPress={() => { Haptics.selectionAsync().catch(() => {}); onChatbot(); }}
            style={({ pressed }) => [styles.heroSecondaryBtn, pressed && { opacity: 0.75 }]}
            accessibilityRole="button"
            accessibilityLabel="AI tư vấn"
            accessibilityHint="Mở trợ lý AI để được tư vấn dịch vụ"
          >
            <MaterialCommunityIcons name="robot-outline" size={18} color="rgba(255,255,255,0.9)" />
            <Text style={styles.heroSecondaryBtnText}>AI tư vấn</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Featured Section ─────────────────────────────────────────────────────────

function FeaturedSection({
  services,
  loading,
  onOpenSearch,
  onOpenService,
}: {
  services: HomeService[];
  loading: boolean;
  onOpenSearch: () => void;
  onOpenService: (service: HomeService) => void;
}) {
  return (
    <View style={styles.section}>
      <SectionHeader
        title="Dịch vụ nổi bật"
        subtitle="Được chọn lọc cho khách hàng"
        actionLabel="Xem thêm"
        onAction={onOpenSearch}
      />
      {loading ? (
        <FlatList
          horizontal
          data={[1, 2]}
          keyExtractor={(item) => `featured-skeleton-${item}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={() => <FeaturedSkeleton />}
        />
      ) : services.length > 0 ? (
        <FlatList
          horizontal
          data={services.slice(0, 6)}
          keyExtractor={(item, index) => stableKey(item.id, `featured-${index}`)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <FeaturedServiceCard service={item} onPress={() => onOpenService(item)} />
          )}
        />
      ) : (
        <InlineMessage tone="neutral" message="Chưa có dịch vụ nổi bật. Hãy tìm kiếm theo nhu cầu của bạn." />
      )}
    </View>
  );
}

function FeaturedServiceCard({
  service,
  onPress,
}: {
  service: HomeService;
  onPress: () => void;
}) {
  return (
    <View style={styles.featuredCard}>
      <View style={styles.featuredBadge}>
        <MaterialCommunityIcons name="star" size={11} color="#FFF" />
        <Text style={styles.featuredBadgeText}>Nổi bật</Text>
      </View>
      <ServiceCard service={service} onPress={onPress} />
    </View>
  );
}

function FeaturedSkeleton() {
  return (
    <CustomerCard style={styles.featuredCard} contentStyle={styles.featuredSkeletonContent}>
      <View style={[styles.skeletonBlock, styles.featuredSkeletonImage]} />
      <View style={[styles.skeletonBlock, { width: '86%', height: 16 }]} />
      <View style={[styles.skeletonBlock, { width: '58%', height: 12 }]} />
      <View style={[styles.skeletonBlock, { width: '44%', height: 14 }]} />
    </CustomerCard>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16, paddingBottom: 112 },
  headerContent: { gap: 16, marginBottom: 12 },
  separator: { height: 12 },
  bellButton: { padding: 10, borderRadius: 999 },
  badge: {
    position: 'absolute',
    right: -8,
    top: -7,
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: Colors.light.error,
    borderWidth: 2,
    borderColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFFFFF', fontWeight: '900', fontVariant: ['tabular-nums'] },
  badgeDot: {
    position: 'absolute',
    right: -1,
    top: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.light.error,
    borderWidth: 2,
    borderColor: Colors.light.surface,
  },
  // Fake Search Bar
  fakeSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
    boxShadow: '0 2px 8px rgba(11,124,255,0.06)',
  },
  fakeSearchPressed: { opacity: 0.80, borderColor: Colors.light.primary },
  fakeSearchText: {
    flex: 1,
    color: Colors.light.textSecondary,
    fontSize: 15,
  },
  // Hero Card
  heroCard: {
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    padding: 20,
    gap: 16,
    overflow: 'hidden',
  },
  heroBubble1: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -50,
    right: -30,
  },
  heroBubble2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: 20,
  },
  heroContent: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { color: '#FFFFFF', fontWeight: '900' },
  heroText: { color: 'rgba(255,255,255,0.80)', lineHeight: 20 },
  heroActions: { flexDirection: 'row', gap: 10 },
  heroPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
  },
  heroPrimaryBtnText: { color: Colors.light.primary, fontWeight: '900', fontSize: 14 },
  heroSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroSecondaryBtnText: { color: 'rgba(255,255,255,0.92)', fontWeight: '900', fontSize: 14 },
  heroSkeleton: { gap: 12 },
  // Featured
  section: { gap: 10 },
  horizontalList: { gap: 10, paddingRight: 16 },
  featuredCard: { width: 296, position: 'relative' },
  featuredBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F59E0B',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featuredBadgeText: { color: '#FFF', fontWeight: '900', fontSize: 11 },
  featuredSkeletonContent: { gap: 10 },
  featuredSkeletonImage: { width: 92, height: 92, borderRadius: 14 },
  skeletonBlock: { backgroundColor: Colors.light.surfaceVariant, borderRadius: 10 },
  // Category chips (kept for backward compat)
  categoryChip: {
    width: 118,
    minHeight: 82,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    padding: 12,
    gap: 8,
    justifyContent: 'center',
    boxShadow: Colors.light.cardShadow,
  },
  pressed: { opacity: 0.72 },
});
