import { useActiveColors } from '../../hooks/useActiveColors';
import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  CustomerCard,
  CustomerHeader,
  EmptyState,
  InlineMessage,
  StatusChip,
} from '../../components/customer/customer-ui';
import { Colors } from '../../constants/colors';
import { authApi } from '../../features/auth/auth.api';
import { useAuthStore } from '../../features/auth/auth.store';
import { bookingApi } from '../../features/booking/booking.api';
import { normalizeList } from '../../lib/api-response';
import { formatDateTime } from '../../lib/format';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from '../../constants/booking-status';
import { stableKey, toRouteId, routes } from '../../lib/route-utils';

type RecentBooking = {
  id?: number | string;
  bookingCode?: string | null;
  status?: string | null;
  service?: { name?: string | null } | null;
  desiredTime?: string | Date | null;
};

function getAvatarLabel(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || 'K';
  return source.charAt(0).toUpperCase();
}

function getStatusLabel(status?: string | null) {
  if (status === 'ACTIVE') return 'Đã xác thực ✓';
  if (status === 'LOCKED') return 'Bị khóa';
  if (status === 'PENDING') return 'Chờ xác thực';
  return 'Khách hàng';
}

function getStatusColor(status?: string | null, activeColors?: any) {
  if (status === 'ACTIVE') return activeColors.success;
  if (status === 'LOCKED') return activeColors.error;
  return activeColors.textSecondary;
}

export default function ProfileScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout, fetchProfile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState('');

  const recentBookingsQuery = useQuery({
    queryKey: ['bookings', 'recent-profile'],
    queryFn: async () => {
      const response = await bookingApi.getMyBookings({ page: 1, limit: 3 });
      return normalizeList<RecentBooking>(response);
    },
    enabled: !!user,
  });

  const recentBookings = recentBookingsQuery.data || [];

  const refresh = async () => {
    setRefreshing(true);
    setMessage('');
    try {
      await fetchProfile();
      recentBookingsQuery.refetch();
    } catch {
      setMessage('Không thể cập nhật thông tin tài khoản.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = () => {
    Haptics.selectionAsync().catch(() => {});
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi Zup?', [
      { text: 'Đóng', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await authApi.logout().catch(() => {});
          await logout();
        },
      },
    ]);
  };

  const statusColor = getStatusColor(user?.status, activeColors);
  const statusLabel = getStatusLabel(user?.status);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: 104 + Math.max(insets.bottom, 12) }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={activeColors.primary} />}
      keyboardShouldPersistTaps="handled"
    >
      <CustomerHeader title="Tài khoản" subtitle="Thông tin cá nhân và cài đặt" />
      {message ? <InlineMessage tone="error" message={message} /> : null}

      {!user ? (
        <EmptyState
          icon="account-alert-outline"
          title="Chưa có thông tin tài khoản"
          description="Kéo xuống để tải lại thông tin hồ sơ."
          actionLabel="Tải lại"
          onAction={refresh}
        />
      ) : (
        <>
          /* ── Hero Profile Card ── */
          <View style={styles.heroCard}>
            {/* Decoration bubbles for Glassmorphism effect */}
            <View style={styles.heroBubble1} />
            <View style={styles.heroBubble2} />
            <View style={styles.heroGlassOverlay} />

            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} contentFit="cover" transition={180} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarLetter}>{getAvatarLabel(user.fullName, user.email)}</Text>
                </View>
              )}
              <Pressable
                style={styles.editAvatarBtn}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.push(routes.profile.edit);
                }}
                accessibilityRole="button"
                accessibilityLabel="Chỉnh sửa ảnh đại diện"
              >
                <MaterialCommunityIcons name="pencil" size={12} color="#FFF" />
              </Pressable>
            </View>

            {/* Info */}
            <Text variant="titleLarge" style={styles.heroName} numberOfLines={1}>
              {user.fullName || 'Khách hàng'}
            </Text>
            <Text variant="bodySmall" style={styles.heroEmail} numberOfLines={1}>
              {user.email}
            </Text>
            <View style={styles.heroBadgeRow}>
              <StatusChip label={statusLabel} color={statusColor} />
              {user.phone ? (
                <View style={styles.heroPhone}>
                  <MaterialCommunityIcons name="phone-outline" size={13} color={activeColors.textSecondary} />
                  <Text variant="labelSmall" style={styles.heroPhoneText}>{user.phone}</Text>
                </View>
              ) : null}
            </View>
          </View>

        </>
      )}

      {/* ── Recent Bookings ── */}
      {user && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text variant="titleSmall" style={styles.sectionTitle}>Hoạt động gần đây</Text>
            <Pressable
              onPress={() => router.push(routes.tabs.bookings)}
              accessibilityRole="button"
            >
              <Text variant="labelSmall" style={styles.sectionAction}>Xem tất cả →</Text>
            </Pressable>
          </View>

          {recentBookingsQuery.isLoading ? (
            <View style={styles.recentSkeletonWrap}>
              {[0, 1].map((i) => (
                <CustomerCard key={i}>
                  <View style={styles.recentSkeleton}>
                    <View style={[styles.skeletonBlock, { width: '60%', height: 14 }]} />
                    <View style={[styles.skeletonBlock, { width: '40%', height: 12 }]} />
                  </View>
                </CustomerCard>
              ))}
            </View>
          ) : recentBookings.length > 0 ? (
            <View style={styles.recentList}>
              {recentBookings.map((booking, index) => {
                const status = booking.status || 'PENDING';
                const color = BOOKING_STATUS_COLOR[status] || activeColors.textSecondary;
                const bookingId = toRouteId(booking.id);
                return (
                  <CustomerCard
                    key={stableKey(booking.id, `recent-${index}`)}
                    onPress={() => {
                      if (!bookingId) return;
                      Haptics.selectionAsync().catch(() => {});
                      router.push(routes.booking.detail(bookingId));
                    }}
                    contentStyle={styles.recentCardContent}
                  >
                    <View style={styles.recentRow}>
                      <View style={{ flex: 1, gap: 3 }}>
                        <Text variant="titleSmall" style={styles.recentServiceName} numberOfLines={1}>
                          {booking.service?.name || 'Dịch vụ'}
                        </Text>
                        <Text variant="labelSmall" style={styles.recentCode}>
                          #{booking.bookingCode || booking.id} · {formatDateTime(booking.desiredTime)}
                        </Text>
                      </View>
                      <StatusChip label={BOOKING_STATUS_LABEL[status] || status} color={color} />
                    </View>
                  </CustomerCard>
                );
              })}
            </View>
          ) : (
            <CustomerCard>
              <Text variant="bodySmall" style={styles.recentEmpty}>Chưa có đơn nào. Đặt dịch vụ ngay!</Text>
            </CustomerCard>
          )}
        </View>
      )}

      {/* ── Group 1: Tài khoản ── */}
      {user && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={styles.groupLabel}>TÀI KHOẢN</Text>
          <CustomerCard contentStyle={{ padding: 0 }}>
            <ProfileAction
              icon="account-edit-outline"
              color="#0B7CFF"
              title="Cập nhật hồ sơ"
              description="Đổi tên, số điện thoại và ảnh đại diện"
              onPress={() => router.push(routes.profile.edit)}
              isLast={false}
            />
            <ProfileAction
              icon="map-marker-outline"
              color="#10B981"
              title="Quản lý địa chỉ"
              description="Thêm địa chỉ đặt dịch vụ và đặt mặc định"
              onPress={() => router.push(routes.profile.addresses)}
              isLast={false}
            />
            <ProfileAction
              icon="heart-outline"
              color="#F43F5E"
              title="Dịch vụ yêu thích"
              description="Danh sách các dịch vụ bạn đã lưu lại"
              onPress={() => router.push('/profile/favorites' as any)}
              isLast={false}
            />
            <ProfileAction
              icon="lock-outline"
              color="#7C3AED"
              title="Đổi mật khẩu"
              description="Cập nhật mật khẩu đăng nhập"
              onPress={() => router.push(routes.profile.changePassword)}
              isLast={true}
            />
          </CustomerCard>
        </View>
      )}

      {/* ── Group 2: Ứng dụng ── */}
      {user && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={styles.groupLabel}>ỨNG DỤNG</Text>
          <CustomerCard contentStyle={{ padding: 0 }}>
            <ProfileAction
              icon="bell-outline"
              color="#EC4899"
              title="Thông báo"
              description="Xem cập nhật đơn hàng và tin nhắn"
              onPress={() => router.push(routes.notifications)}
              isLast={false}
            />
            <ProfileAction
              icon="help-circle-outline"
              color="#0284C7"
              title="Trợ giúp & Hỗ trợ"
              description="Câu hỏi thường gặp và liên hệ hỗ trợ"
              onPress={() => {}}
              isLast={true}
            />
          </CustomerCard>
        </View>
      )}

      {/* ── Logout ── */}
      {user && (
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.75 }]}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất"
        >
          <MaterialCommunityIcons name="logout" size={20} color={activeColors.error} />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

function ProfileAction({
  icon,
  color,
  title,
  description,
  onPress,
  isLast = false,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  color?: string;
  title: string;
  description: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const actionColor = color || activeColors.primary;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.actionItemPressable,
        pressed && { backgroundColor: activeColors.surfaceVariant },
      ]}
    >
      <View style={styles.actionContent}>
        <View style={[styles.actionIcon, { backgroundColor: `${color}14` }]}>
          <MaterialCommunityIcons name={icon} size={22} color={color} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="titleSmall" style={styles.actionTitle}>
            {title}
          </Text>
          <Text variant="bodySmall" style={styles.muted} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={activeColors.textSecondary} />
      </View>
      {!isLast && <View style={styles.actionDivider} />}
    </Pressable>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: activeColors.background },
  content: { padding: 16, gap: 16 },
  // Hero Card
  heroCard: {
    backgroundColor: activeColors.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: activeColors.border,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
    boxShadow: activeColors.cardShadow,
  },
  heroBubble1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: activeColors.primarySoft,
    top: -90,
    right: -70,
    opacity: 0.9,
  },
  heroBubble2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: activeColors.warningBg, // Warm peach background
    bottom: -60,
    left: -45,
    opacity: 0.8,
  },
  heroGlassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  avatarWrapper: { position: 'relative', marginBottom: 4 },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: activeColors.surface,
    backgroundColor: activeColors.surfaceVariant,
    boxShadow: activeColors.elevation,
  },
  avatarInitial: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: activeColors.surface,
    backgroundColor: activeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: activeColors.elevation,
  },
  avatarLetter: { color: activeColors.surface, fontWeight: '900', fontSize: 34 },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: activeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: activeColors.surface,
    boxShadow: activeColors.elevation,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: activeColors.warning,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: activeColors.surface,
    boxShadow: activeColors.elevation,
  },
  heroName: { color: activeColors.text, fontWeight: '900', textAlign: 'center' },
  heroEmail: { color: activeColors.textSecondary, textAlign: 'center' },
  heroBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  heroPhone: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroPhoneText: { color: activeColors.textSecondary },
  // Sections
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: activeColors.text, fontWeight: '900' },
  sectionAction: { color: activeColors.primary, fontWeight: '700' },
  groupLabel: {
    color: activeColors.textSecondary,
    fontWeight: '900',
    letterSpacing: 0.8,
    paddingLeft: 4,
    marginTop: 8,
  },
  // Recent bookings
  recentList: { gap: 8 },
  recentSkeletonWrap: { gap: 8 },
  recentCardContent: { paddingVertical: 12 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recentServiceName: { color: activeColors.text, fontWeight: '900' },
  recentCode: { color: activeColors.textSecondary },
  recentSkeleton: { gap: 8 },
  recentEmpty: { color: activeColors.textSecondary, textAlign: 'center', paddingVertical: 4 },
  // Action list
  actionList: { gap: 8 },
  actionItemPressable: {
    width: '100%',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: { color: activeColors.text, fontWeight: '900' },
  muted: { color: activeColors.textSecondary, lineHeight: 16 },
  actionDivider: {
    height: 1,
    backgroundColor: activeColors.border,
    marginLeft: 70, // Matches icon width (42) + gap (12) + padding left (16)
    marginRight: 16,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: `${activeColors.error}12`,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: `${activeColors.error}30`,
    marginTop: 8,
  },
  logoutText: { color: activeColors.error, fontWeight: '900', fontSize: 15 },
  // Skeleton
  skeletonBlock: { backgroundColor: activeColors.surfaceVariant, borderRadius: 10 },
  // Stats & Loyalty
  statsCard: {
    backgroundColor: activeColors.surface,
    marginTop: -8,
  },
  statsCardContent: {
    padding: 0,
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  walletSection: {
    flex: 1,
    padding: 16,
    gap: 4,
  },
  memberSection: {
    flex: 1,
    padding: 16,
    gap: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletTitle: {
    fontWeight: '700',
    color: activeColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletBalance: {
    fontWeight: '900',
    color: activeColors.text,
    fontSize: 22,
    lineHeight: 28,
  },
  walletUnit: {
    color: activeColors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  walletEquivalent: {
    color: activeColors.textSecondary,
    fontSize: 11,
  },
  walletLink: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  walletLinkText: {
    color: activeColors.primary,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: activeColors.border,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: activeColors.surfaceVariant,
    borderRadius: 3,
    marginTop: 8,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  progressText: {
    color: activeColors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
});
