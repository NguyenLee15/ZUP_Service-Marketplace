/**
 * Notifications screen - provider updates.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, IconButton, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { notificationApi } from '../features/notification/notification.api';
import { useNotificationStore } from '../features/notification/notification.store';
import { Colors } from '../constants/colors';
import {
  ProviderCard,
  ProviderEmptyState,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderScreen,
} from '../components/provider/provider-ui';

const NOTIF_ICON: Record<string, ComponentProps<typeof MaterialCommunityIcons>['name']> = {
  BOOKING: 'clipboard-text-outline',
  QUOTATION: 'file-document-outline',
  WALLET: 'wallet-outline',
  KYC: 'card-account-details-outline',
  SERVICE: 'briefcase-outline',
  CHAT: 'chat-outline',
  SYSTEM: 'bell-outline',
};

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setUnreadCount } = useNotificationStore();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (p = 1, reset = false) => {
    try {
      const res = await notificationApi.getAll({ page: p, limit: 20 });
      const data = res.data?.data || [];
      if (reset || p === 1) setNotifications(data);
      else setNotifications(prev => [...prev, ...data]);
      setHasMore(data.length === 20);
      setPage(p);
    } catch {
      setMessage({ tone: 'error', text: 'Không thể tải thông báo. Kéo xuống để thử lại.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setMessage(null);
    await fetchNotifications(1, true);
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setNotifications(prev => prev.map(notification => ({ ...notification, isRead: true })));
      setUnreadCount(0);
      setMessage({ tone: 'success', text: 'Đã đánh dấu tất cả thông báo là đã đọc.' });
    } catch {
      setMessage({ tone: 'error', text: 'Chưa thể đánh dấu tất cả là đã đọc.' });
    }
  };

  const handlePress = async (notification: any) => {
    if (!notification.isRead) {
      try {
        await notificationApi.markRead(notification.id);
        setNotifications(prev => prev.map(item => (item.id === notification.id ? { ...item, isRead: true } : item)));
      } catch {}
    }
    if (notification.bookingId) router.push(`/booking/${notification.bookingId}` as any);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} giờ trước`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  };

  const renderNotification = ({ item }: { item: any }) => {
    const icon = NOTIF_ICON[item.type] || 'bell-outline';
    const isUnread = !item.isRead;

    return (
      <ProviderCard
        onPress={() => handlePress(item)}
        accessibilityLabel={item.title || item.message || 'Thông báo'}
        style={isUnread ? styles.unreadCard : undefined}
        contentStyle={styles.notificationContent}
      >
        <View style={[styles.iconBg, { backgroundColor: isUnread ? `${Colors.light.primary}14` : Colors.light.surfaceVariant }]}>
          <MaterialCommunityIcons name={icon} size={21} color={isUnread ? Colors.light.primary : Colors.light.textSecondary} />
        </View>
        <View style={styles.notificationText}>
          <Text variant="bodyLarge" style={[styles.notificationTitle, isUnread && styles.unreadTitle]} numberOfLines={2}>
            {item.title || item.message}
          </Text>
          {item.message && item.title && (
            <Text variant="bodySmall" style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
          )}
          <Text variant="labelSmall" style={styles.notificationTime}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </ProviderCard>
    );
  };

  return (
    <ProviderScreen>
      <FlatList
        data={notifications}
        keyExtractor={item => String(item.id)}
        renderItem={renderNotification}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.light.primary]} />}
        onEndReached={() => {
          if (hasMore && !loading) fetchNotifications(page + 1);
        }}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <ProviderPageHeader
              title="Thông báo"
              subtitle="Cập nhật đơn hàng, ví, KYC và tin nhắn."
              action={<IconButton icon="arrow-left" mode="contained-tonal" onPress={() => router.back()} accessibilityLabel="Quay lại" />}
            />
            {message && <ProviderInlineMessage tone={message.tone} message={message.text} />}
            {notifications.length > 0 && (
              <Button mode="outlined" compact onPress={handleMarkAllRead} style={styles.markAllButton}>
                Đọc tất cả
              </Button>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loading} color={theme.colors.primary} />
          ) : (
            <ProviderEmptyState
              icon="bell-check-outline"
              title="Không có thông báo"
              description="Khi có cập nhật mới về đơn hàng hoặc tài khoản, thông báo sẽ hiển thị tại đây."
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
    paddingBottom: 56,
  },
  headerStack: {
    gap: 12,
    marginBottom: 12,
  },
  markAllButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
  },
  unreadCard: {
    borderColor: `${Colors.light.primary}50`,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    color: Colors.light.text,
    fontWeight: '600',
  },
  unreadTitle: {
    fontWeight: '800',
  },
  notificationMessage: {
    color: Colors.light.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },
  notificationTime: {
    color: Colors.light.textSecondary,
    marginTop: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.primary,
    marginTop: 8,
  },
  loading: {
    marginTop: 40,
  },
});
