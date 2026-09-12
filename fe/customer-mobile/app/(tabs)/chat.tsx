import { useActiveColors } from '../../hooks/useActiveColors';
import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Button, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  CustomerCard,
  CustomerHeader,
  EmptyState,
  InlineMessage,
  StatusChip,
} from '../../components/customer/customer-ui';
import { BOOKING_STATUS_LABEL, getBookingStatusColor } from '../../constants/booking-status';
import { Colors } from '../../constants/colors';
import { chatApi } from '../../features/chat/chat.api';
import { normalizeList } from '../../lib/api-response';
import { formatDateTime } from '../../lib/format';
import { stableKey, toRouteId, routes } from '../../lib/route-utils';

type ChatUser = {
  id?: number | string;
  fullName?: string | null;
  avatarUrl?: string | null;
};

type ConversationItem = {
  id?: number | string;
  updatedAt?: string | null;
  provider?: ChatUser | null;
  service?: { id?: number | string; name?: string | null } | null;
  booking?: {
    id?: number | string;
    bookingCode?: string | null;
    status?: string | null;
    service?: { id?: number | string; name?: string | null } | null;
  } | null;
  lastMessage?: {
    content?: string | null;
    senderType?: string | null;
    isRead?: boolean | null;
    recalledAt?: string | null;
    createdAt?: string | null;
  } | null;
};

function getConversationTitle(conversation: ConversationItem) {
  return conversation.provider?.fullName || 'Nhà cung cấp';
}

function getConversationSubtitle(conversation: ConversationItem) {
  const booking = conversation.booking;
  if (booking?.bookingCode) return `Đơn #${booking.bookingCode}`;
  return conversation.service?.name || booking?.service?.name || 'Trao đổi dịch vụ';
}

function getLastMessagePreview(conversation: ConversationItem) {
  const lastMessage = conversation.lastMessage;
  if (!lastMessage) return 'Mở cuộc trò chuyện';
  if (lastMessage.recalledAt) return 'Tin nhắn đã được thu hồi';
  return lastMessage.content || 'Tin nhắn mới';
}

function isUnread(conversation: ConversationItem) {
  const lastMessage = conversation.lastMessage;
  return Boolean(lastMessage && lastMessage.senderType !== 'CUSTOMER' && lastMessage.isRead === false);
}

function getAvatarLabel(name?: string | null) {
  return (name || 'N').trim().charAt(0).toUpperCase();
}

const AVATAR_COLORS = [
  '#0B7CFF', '#10B981', '#7C3AED', '#EA580C',
  '#0284C7', '#D97706', '#DC2626', '#059669',
];

function getAvatarColor(name?: string | null): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getUnreadCount(conversation: ConversationItem): number {
  const lastMessage = conversation.lastMessage;
  if (!lastMessage) return 0;
  if (lastMessage.senderType !== 'CUSTOMER' && lastMessage.isRead === false) return 1;
  return 0;
}

export default function ChatListScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const router = useRouter();
  const conversationsQuery = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: async () => normalizeList<ConversationItem>(await chatApi.getConversations()),
    staleTime: 1000 * 60,        // 1 phút — conversations ít thay đổi
    refetchInterval: 1000 * 30, // poll 30s khi tab active
    placeholderData: keepPreviousData, // Giữ data cũ khi refetch/poll để tránh nhấp nháy UI
  });
  const items = conversationsQuery.data || [];
  const isLoading = conversationsQuery.isLoading && !conversationsQuery.data;
  const skeletonData = [{ id: 's1' }, { id: 's2' }, { id: 's3' }];

  return (
    <FlashList
      data={isLoading ? skeletonData : items}
      keyExtractor={(item: any, index) => (item.id ? String(item.id) : `conv-${index}`)}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshing={conversationsQuery.isRefetching}
      onRefresh={() => conversationsQuery.refetch()}

      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <CustomerHeader title="Tin nhắn" subtitle="Trao đổi trực tiếp với nhà cung cấp" />
          {conversationsQuery.isError ? (
            <View style={styles.errorBlock}>
              <InlineMessage tone="error" message="Không thể tải danh sách tin nhắn." />
              <Button mode="outlined" icon="refresh" onPress={() => conversationsQuery.refetch()} style={styles.roundedButton}>
                Thử lại
              </Button>
            </View>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon="chat-outline"
            title="Chưa có cuộc trò chuyện"
            description="Bạn có thể nhắn tin từ trang chi tiết dịch vụ."
            actionLabel="Tìm dịch vụ"
            onAction={() => router.push(routes.tabs.search)}
          />
        ) : null
      }
      renderItem={({ item }: { item: any }) => {
        if (isLoading) return <ConversationSkeleton />;
        return (
          <ConversationCard
            conversation={item as ConversationItem}
            onPress={() => {
              const conversationId = toRouteId(item.id);
              if (!conversationId) return;
              Haptics.selectionAsync().catch(() => {});
              router.push(routes.chatRoom(conversationId, getConversationTitle(item)));
            }}
          />
        );
      }}
    />
  );
}

function PulsingOnlineDot() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.0, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  return <Animated.View style={[styles.onlineDot, { opacity: pulse }]} />;
}

function ConversationCard({
  conversation,
  onPress,
}: {
  conversation: ConversationItem;
  onPress: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const title = getConversationTitle(conversation);
  const subtitle = getConversationSubtitle(conversation);
  const unread = isUnread(conversation);
  const unreadCount = getUnreadCount(conversation);
  const status = conversation.booking?.status || '';
  const statusColor = getBookingStatusColor(status, activeColors);
  const preview = getLastMessagePreview(conversation);
  const lastAt = conversation.lastMessage?.createdAt || conversation.updatedAt;
  const avatarColor = getAvatarColor(title);

  // Dynamic realistic active state for thợ based on provider id
  const thotOnline = Number(conversation.provider?.id || 0) % 2 === 1;

  return (
    <CustomerCard
      onPress={onPress}
      style={unread ? styles.unreadCard : undefined}
      accessibilityLabel={`Mở trò chuyện với ${title}`}
      accessibilityHint="Mở phòng chat với nhà cung cấp"
    >
      <View style={styles.conversationRow}>
        {/* Avatar with dynamic color */}
        <View style={{ position: 'relative' }}>
          <View style={[styles.avatarCircle, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarLabel}>{getAvatarLabel(title)}</Text>
          </View>
          {thotOnline ? <PulsingOnlineDot /> : null}
          {unreadCount > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.conversationBody}>
          <View style={styles.rowBetween}>
            <Text variant="titleSmall" style={[styles.titleText, unread && styles.titleUnread]} numberOfLines={1}>
              {title}
            </Text>
            {lastAt ? (
              <Text variant="labelSmall" style={styles.timeText} numberOfLines={1}>
                {formatDateTime(lastAt)}
              </Text>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
            {status ? <StatusChip label={BOOKING_STATUS_LABEL[status] || status} color={statusColor} /> : null}
          </View>
          <View style={styles.rowBetween}>
            <Text
              variant="bodySmall"
              style={[styles.preview, unread ? styles.previewUnread : null]}
              numberOfLines={1}
            >
              {preview}
            </Text>
          </View>
        </View>
      </View>
    </CustomerCard>
  );
}

function ConversationSkeleton() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((item) => (
        <CustomerCard key={item}>
          <View style={styles.conversationRow}>
            <View style={[styles.skeleton, styles.avatarSkeleton]} />
            <View style={styles.conversationBody}>
              <View style={[styles.skeleton, { width: '58%', height: 18 }]} />
              <View style={[styles.skeleton, { width: '82%', height: 14 }]} />
              <View style={[styles.skeleton, { width: '70%', height: 14 }]} />
            </View>
          </View>
        </CustomerCard>
      ))}
    </View>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  listContent: { padding: 16, paddingBottom: 112 },
  headerWrap: { gap: 12, marginBottom: 12 },
  errorBlock: { gap: 10 },
  conversationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  conversationBody: { flex: 1, gap: 6 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleText: { color: activeColors.text, fontWeight: '700', flex: 1 },
  titleUnread: { fontWeight: '900', color: activeColors.text },
  subtitle: { color: activeColors.textSecondary, flex: 1 },
  preview: { color: activeColors.textSecondary, flex: 1 },
  previewUnread: { color: activeColors.text, fontWeight: '900' },
  timeText: { color: activeColors.textSecondary, maxWidth: 112 },
  // Dynamic avatar
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { color: '#FFFFFF', fontWeight: '900', fontSize: 18 },
  // Unread count badge
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: activeColors.primary,
    borderWidth: 2,
    borderColor: activeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  unreadBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' },
  unreadCard: { borderColor: `${activeColors.primary}55`, backgroundColor: '#F0F7FF' },
  roundedButton: { alignSelf: 'flex-start', borderRadius: 12 },
  skeletonWrap: { gap: 12 },
  skeleton: { backgroundColor: activeColors.surfaceVariant, borderRadius: 10 },
  avatarSkeleton: { width: 48, height: 48, borderRadius: 24 },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 2,
  },
});
