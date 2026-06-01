/**
 * Notifications screen - provider updates.
 */
import { useCallback, useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { RefreshControl, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Chip,
  IconButton,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { FlashList } from "@shopify/flash-list";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { notificationApi } from "../features/notification/notification.api";
import { useNotificationStore } from "../features/notification/notification.store";
import { Colors } from "../constants/colors";
import { routes } from "../lib/route-utils";
import {
  ProviderCard,
  ProviderEmptyState,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderScreen,
} from "../components/provider/provider-ui";

type ProviderNotification = {
  id: number;
  type?: string;
  title?: string;
  content?: string;
  message?: string;
  referenceId?: number | string | null;
  bookingId?: number | string | null;
  isRead?: boolean;
  createdAt: string;
};

const NOTIF_ICON: Record<
  string,
  ComponentProps<typeof MaterialCommunityIcons>["name"]
> = {
  NEW_BOOKING: "clipboard-alert-outline",
  PROVIDER_ACCEPTED_BOOKING: "clipboard-check-outline",
  PROVIDER_DECLINED_BOOKING: "clipboard-remove-outline",
  PROVIDER_ACCEPTANCE_TIMEOUT: "timer-off-outline",
  BOOKING_ACCEPTANCE_EXPIRED: "timer-off-outline",
  BOOKING: "clipboard-text-outline",
  QUOTATION: "file-document-outline",
  WALLET: "wallet-outline",
  KYC: "card-account-details-outline",
  SERVICE: "briefcase-outline",
  CHAT: "chat-outline",
  SYSTEM: "bell-outline",
};

const getNotificationRoute = (notification: ProviderNotification) => {
  const type = String(notification.type || "").toUpperCase();
  const referenceId = Number(
    notification.referenceId || notification.bookingId,
  );

  if (
    Number.isFinite(referenceId) &&
    referenceId > 0 &&
    ["BOOKING", "QUOTE", "QUOTATION", "WORK", "SURVEYOR", "SLA"].some((key) =>
      type.includes(key),
    )
  ) {
    return routes.booking.detail(String(referenceId));
  }

  if (type.includes("WALLET")) return routes.tabs.wallet;
  if (type.includes("KYC")) return routes.profile.kyc;
  if (type.includes("SERVICE")) return routes.services;
  if (type.includes("CHAT")) return routes.tabs.chat;

  return null;
};

export default function NotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setUnreadCount } = useNotificationStore();

  const [notifications, setNotifications] = useState<ProviderNotification[]>(
    [],
  );
  const [message, setMessage] = useState<{
    tone: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchNotifications = useCallback(
    async (p = 1, reset = false) => {
      try {
        const res = await notificationApi.getAll({
          page: p,
          limit: 20,
          isRead: readFilter === "all" ? undefined : readFilter === "read",
          type: typeFilter.trim() || undefined,
        });
        const data = res.data?.data || [];
        if (reset || p === 1) setNotifications(data);
        else setNotifications((prev) => [...prev, ...data]);
        setHasMore(data.length === 20);
        setPage(p);
      } catch {
        setMessage({
          tone: "error",
          text: "Không thể tải thông báo. Kéo xuống để thử lại.",
        });
      } finally {
        setLoading(false);
      }
    },
    [readFilter, typeFilter],
  );

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
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
      setUnreadCount(0);
      setMessage({
        tone: "success",
        text: "Đã đánh dấu tất cả thông báo là đã đọc.",
      });
    } catch {
      setMessage({
        tone: "error",
        text: "Chưa thể đánh dấu tất cả là đã đọc.",
      });
    }
  };

  const handleDelete = async (notification: ProviderNotification) => {
    setDeletingId(notification.id);
    try {
      await notificationApi.delete(notification.id);
      setNotifications((prev) =>
        prev.filter((item) => item.id !== notification.id),
      );
      if (!notification.isRead) {
        setUnreadCount(
          Math.max(0, notifications.filter((item) => !item.isRead).length - 1),
        );
      }
      setMessage({ tone: "success", text: "Đã xóa thông báo." });
    } catch {
      setMessage({ tone: "error", text: "Chưa thể xóa thông báo." });
    } finally {
      setDeletingId(null);
    }
  };

  const handlePress = async (notification: ProviderNotification) => {
    if (!notification.isRead) {
      try {
        await notificationApi.markRead(notification.id);
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );
      } catch {}
    }
    const route = getNotificationRoute(notification);
    if (route) {
      router.push(route);
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} giờ trước`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} ngày trước`;
    return d.toLocaleDateString("vi-VN");
  };

  const renderNotification = ({ item }: { item: ProviderNotification }) => {
    const icon = NOTIF_ICON[item.type || ""] || "bell-outline";
    const isUnread = !item.isRead;
    const body = item.content || item.message;

    return (
      <ProviderCard
        onPress={() => handlePress(item)}
        accessibilityLabel={item.title || item.message || "Thông báo"}
        style={isUnread ? styles.unreadCard : undefined}
        contentStyle={styles.notificationContent}
      >
        <View
          style={[
            styles.iconBg,
            {
              backgroundColor: isUnread
                ? `${Colors.light.primary}14`
                : Colors.light.surfaceVariant,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={21}
            color={isUnread ? Colors.light.primary : Colors.light.textSecondary}
          />
        </View>
        <View style={styles.notificationText}>
          <Text
            variant="bodyLarge"
            style={[styles.notificationTitle, isUnread && styles.unreadTitle]}
            numberOfLines={2}
          >
            {item.title || item.message}
          </Text>
          {body && item.title && (
            <Text
              variant="bodySmall"
              style={styles.notificationMessage}
              numberOfLines={2}
            >
              {body}
            </Text>
          )}
          <Text variant="labelSmall" style={styles.notificationTime}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
        <IconButton
          icon="trash-can-outline"
          size={18}
          loading={deletingId === item.id}
          disabled={deletingId === item.id}
          iconColor={Colors.light.error}
          onPress={() => handleDelete(item)}
          accessibilityLabel="Xóa thông báo"
          style={styles.deleteButton}
        />
        {isUnread && <View style={styles.unreadDot} />}
      </ProviderCard>
    );
  };

  return (
    <ProviderScreen>
      <FlashList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderNotification}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.primary]}
          />
        }
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
              action={
                <IconButton
                  icon="arrow-left"
                  mode="contained-tonal"
                  onPress={() => router.back()}
                  accessibilityLabel="Quay lại"
                />
              }
            />
            {message && (
              <ProviderInlineMessage
                tone={message.tone}
                message={message.text}
              />
            )}
            {notifications.length > 0 && (
              <Button
                mode="outlined"
                compact
                onPress={handleMarkAllRead}
                style={styles.markAllButton}
              >
                Đọc tất cả
              </Button>
            )}
            <View style={styles.filterCard}>
              <View style={styles.filterChips}>
                {[
                  { key: "all", label: "Tất cả" },
                  { key: "unread", label: "Chưa đọc" },
                  { key: "read", label: "Đã đọc" },
                ].map((item) => (
                  <Chip
                    key={item.key}
                    selected={readFilter === item.key}
                    onPress={() => {
                      setReadFilter(item.key as typeof readFilter);
                      setPage(1);
                    }}
                    style={styles.filterChip}
                  >
                    {item.label}
                  </Chip>
                ))}
              </View>
              <TextInput
                mode="outlined"
                dense
                label="Lọc theo loại"
                value={typeFilter}
                onChangeText={(value) => {
                  setTypeFilter(value);
                  setPage(1);
                }}
                placeholder="BOOKING, WALLET..."
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator
              style={styles.loading}
              color={theme.colors.primary}
            />
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
    alignSelf: "flex-start",
    borderRadius: 999,
  },
  filterCard: {
    gap: 10,
    padding: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
  },
  unreadCard: {
    borderColor: `${Colors.light.primary}50`,
  },
  notificationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationText: {
    flex: 1,
    minWidth: 0,
  },
  notificationTitle: {
    color: Colors.light.text,
    fontWeight: "600",
  },
  unreadTitle: {
    fontWeight: "800",
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
  deleteButton: {
    margin: -8,
  },
  loading: {
    marginTop: 40,
  },
});
