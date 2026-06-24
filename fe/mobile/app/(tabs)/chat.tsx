/**
 * Chat tab - conversation list + unread badges.
 */
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, Badge, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import { routes } from '../../lib/route-utils';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { chatApi } from '../../features/chat/chat.api';
import { Colors } from '../../constants/colors';
import {
  ProviderCard,
  ProviderEmptyState,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderScreen,
} from '../../components/provider/provider-ui';

export default function ChatListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await chatApi.getConversations();
      setConversations(res.data?.data || []);
    } catch {
      setMessage('Không thể tải danh sách tin nhắn. Kéo xuống để thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setMessage(null);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} giờ`;
    return d.toLocaleDateString('vi-VN');
  };

  const renderConversation = ({ item }: { item: any }) => {
    const customer = item.customer;
    const lastMessage = item.lastMessage;
    const unread = item.unreadCount || 0;
    const isAi = lastMessage?.isAiGenerated;
    const contextName = item.service?.name || item.booking?.service?.name || (item.booking ? `Đơn #${item.booking.bookingCode}` : 'Trao đổi trước đặt');

    return (
      <ProviderCard
        style={styles.conversationCard}
        contentStyle={styles.conversationRow}
        accessibilityLabel={`Tin nhắn với ${customer?.fullName || 'khách hàng'}`}
        onPress={() => {
          const svcId = item.service?.id || item.booking?.service?.id;
          router.push(
            routes.chatRoom(
              String(item.id),
              customer?.fullName || 'Khách hàng',
              contextName,
              item.booking ? 'booking' : 'service',
              svcId ? String(svcId) : undefined
            )
          );
        }}
      >
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={48}
            label={customer?.fullName?.charAt(0) || 'K'}
            style={[styles.avatar, { backgroundColor: `${theme.colors.primary}16` }]}
            labelStyle={[styles.avatarLabel, { color: theme.colors.primary }]}
          />
          {unread > 0 && <Badge style={[styles.badge, { backgroundColor: theme.colors.error }]}>{unread > 9 ? '9+' : unread}</Badge>}
        </View>

        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text variant="titleSmall" style={[styles.customerName, { color: theme.colors.onSurface }, unread > 0 && { fontWeight: '800' }]} numberOfLines={1}>
              {customer?.fullName || 'Khách hàng'}
            </Text>
            <Text variant="labelSmall" style={{ color: unread > 0 ? theme.colors.primary : theme.colors.onSurfaceVariant }}>
              {lastMessage ? formatTime(lastMessage.createdAt) : ''}
            </Text>
          </View>
          <View style={styles.lastMessageRow}>
            {isAi && <MaterialCommunityIcons name="robot-outline" size={14} color={theme.colors.secondary} />}
            <Text variant="bodySmall" style={[styles.lastMessage, { color: unread > 0 ? theme.colors.onSurface : theme.colors.onSurfaceVariant }, unread > 0 && { fontWeight: '800' }]} numberOfLines={1}>
              {lastMessage?.content || 'Chưa có tin nhắn'}
            </Text>
          </View>
          <Text variant="labelSmall" style={[styles.serviceName, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
            {contextName}
          </Text>
        </View>
      </ProviderCard>
    );
  };

  return (
    <ProviderScreen>
      <FlashList
        data={conversations}
        keyExtractor={item => String(item.id)}
        renderItem={renderConversation}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <ProviderPageHeader title="Tin nhắn" subtitle="Trao đổi với khách hàng theo dịch vụ hoặc đơn hàng." />
            {message && <ProviderInlineMessage tone="error" message={message} />}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loading} color={theme.colors.primary} />
          ) : (
            <ProviderEmptyState
              icon="chat-outline"
              title="Chưa có cuộc trò chuyện"
              description="Tin nhắn từ khách hàng sẽ xuất hiện tại đây khi họ hỏi về dịch vụ hoặc tạo đơn."
            />
          )
        }
      />
    </ProviderScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 112,
  },
  headerStack: {
    gap: 12,
    marginBottom: 12,
  },
  conversationCard: {
    marginBottom: 10,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    // Dynamic color applied inline
  },
  avatarLabel: {
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
  },
  conversationContent: {
    flex: 1,
    minWidth: 0,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  customerName: {
    flex: 1,
    fontWeight: '700',
  },
  lastMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lastMessage: {
    flex: 1,
  },
  serviceName: {
    marginTop: 4,
  },
  loading: {
    marginTop: 40,
  },
});
