import { useActiveColors } from '../hooks/useActiveColors';
import { useEffect, useMemo, useState, useRef } from "react";
import { View, StyleSheet, Animated, AppState, Vibration } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Chip, IconButton, Text, TextInput } from "react-native-paper";
import { useRouter } from "expo-router";
import { io } from "socket.io-client";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import {
  CustomerCard,
  CustomerHeader,
  EmptyState,
  InlineMessage,
} from "../components/customer/customer-ui";
import { Colors } from "../constants/colors";
import { WS_URL } from "../constants/api";
import { notificationApi } from "../features/notification/notification.api";
import { normalizeList, unwrapData } from "../lib/api-response";
import { stableKey, toRouteId, routes } from "../lib/route-utils";
import { storage } from "../lib/storage";
import { getNotifSocket } from "../lib/socket";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

type NotificationItem = {
  id?: number | string;
  type?: string | null;
  title?: string | null;
  content?: string | null;
  message?: string | null;
  referenceId?: number | string | null;
  isRead?: boolean | null;
  readAt?: string | null;
  createdAt?: string | null;
};

type NotificationsPayload = {
  items: NotificationItem[];
  unreadCount: number;
};

const BOOKING_NOTIFICATION_TYPES = new Set([
  "NEW_BOOKING",
  "PROVIDER_ACCEPTED_BOOKING",
  "QUOTE_RECEIVED",
  "QUOTE_CONFIRMED",
  "QUOTE_REJECTED",
  "WORK_STARTED",
  "WORK_COMPLETED",
  "BOOKING_ACCEPTED",
  "BOOKING_DISPUTED",
  "PROVIDER_DECLINED_BOOKING",
  "PROVIDER_ACCEPTANCE_TIMEOUT",
]);

function isUnreadNotification(item: NotificationItem) {
  return item.isRead === false || (!item.isRead && !item.readAt);
}

function dedupeNotifications(items: NotificationItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = String(
      item.id || `${item.type}-${item.referenceId}-${item.createdAt}`,
    );
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getNotificationIcon(type?: string | null): IconName {
  const value = String(type || "");
  if (value.includes("QUOTE")) return "file-document-outline";
  if (
    value.includes("BOOKING") ||
    value.includes("WORK") ||
    value.includes("PROVIDER")
  ) {
    return "clipboard-text-outline";
  }
  if (value.includes("SERVICE")) return "tools";
  if (value.includes("DISPUTE")) return "alert-outline";
  return "bell-outline";
}

function getNotificationTone(type?: string | null, activeColors?: any) {
  const value = String(type || "");
  if (
    value.includes("DISPUTE") ||
    value.includes("DECLINED") ||
    value.includes("TIMEOUT")
  ) {
    return activeColors.warning;
  }
  if (value.includes("COMPLETED") || value.includes("ACCEPTED"))
    return activeColors.success;
  if (value.includes("QUOTE")) return "#7C3AED";
  return activeColors.primary;
}

function getNotificationTarget(item: NotificationItem) {
  const referenceId = toRouteId(item.referenceId);
  if (!referenceId) return null;

  const type = String(item.type || "");
  if (
    BOOKING_NOTIFICATION_TYPES.has(type) ||
    type.includes("BOOKING") ||
    type.includes("QUOTE") ||
    type.includes("WORK")
  ) {
    return routes.booking.detail(referenceId);
  }
  if (type.includes("SERVICE")) {
    return routes.service(referenceId);
  }
  return null;
}

function formatNotificationTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function parseNotifications(payload: unknown): NotificationsPayload {
  const data: any = unwrapData(payload);
  const items = normalizeList<NotificationItem>(payload);
  const unreadCount = Number(
    data?.meta?.unreadCount ??
      data?.unreadCount ??
      items.filter(isUnreadNotification).length,
  );
  return { items, unreadCount: Number.isFinite(unreadCount) ? unreadCount : 0 };
}

export default function NotificationsScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [socketMessage, setSocketMessage] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState("");
  const notificationsQueryKey = [
    "notifications",
    readFilter,
    typeFilter,
  ] as const;

  const notificationsQuery = useQuery({
    queryKey: notificationsQueryKey,
    queryFn: async () =>
      parseNotifications(
        await notificationApi.getAll({
          page: 1,
          limit: 50,
          isRead: readFilter === "all" ? undefined : readFilter === "read",
          type: typeFilter.trim() || undefined,
        }),
      ),
  });

  const notifications = notificationsQuery.data?.items || [];
  const unreadCount = useMemo(
    () =>
      notificationsQuery.data?.unreadCount ??
      notifications.filter(isUnreadNotification).length,
    [notifications, notificationsQuery.data?.unreadCount],
  );

  const invalidateUnread = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications", "unread"] });
  };

  const markRead = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<NotificationsPayload>(
        notificationsQueryKey,
      );
      queryClient.setQueryData<NotificationsPayload>(
        notificationsQueryKey,
        (current) => {
          if (!current) return current;
          const wasUnread = current.items.some(
            (item) => Number(item.id) === id && isUnreadNotification(item),
          );
          return {
            ...current,
            unreadCount: Math.max(0, current.unreadCount - (wasUnread ? 1 : 0)),
            items: current.items.map((item) =>
              Number(item.id) === id ? { ...item, isRead: true } : item,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous)
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      invalidateUnread();
    },
  });

  const markAll = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<NotificationsPayload>(
        notificationsQueryKey,
      );
      queryClient.setQueryData<NotificationsPayload>(
        notificationsQueryKey,
        (current) =>
          current
            ? {
                ...current,
                unreadCount: 0,
                items: current.items.map((item) => ({ ...item, isRead: true })),
              }
            : current,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous)
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      invalidateUnread();
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id: number) => notificationApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });
      const previous = queryClient.getQueryData<NotificationsPayload>(
        notificationsQueryKey,
      );
      queryClient.setQueryData<NotificationsPayload>(
        notificationsQueryKey,
        (current) => {
          if (!current) return current;
          const deletedItem = current.items.find(
            (item) => Number(item.id) === id,
          );
          return {
            ...current,
            unreadCount: Math.max(
              0,
              current.unreadCount -
                (deletedItem && isUnreadNotification(deletedItem) ? 1 : 0),
            ),
            items: current.items.filter((item) => Number(item.id) !== id),
          };
        },
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(notificationsQueryKey, context.previous);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      invalidateUnread();
    },
  });

  useEffect(() => {
    let active = true;
    let socket: ReturnType<typeof io> | null = null;

    setConnectionState("connecting");
    storage
      .getAccessToken()
      .then((token) => {
        if (!active) return;
        if (!token) {
          setConnectionState("error");
          return;
        }

        socket = io(`${WS_URL}/notifications`, {
          transports: ["websocket"],
          auth: (cb) => {
            storage.getAccessToken().then(t => cb({ token: t }));
          },
        });

        socket.on("connect", () => {
          if (!active) return;
          setConnectionState("connected");
        });

        socket.on("disconnect", () => {
          if (!active) return;
          setConnectionState("disconnected");
        });

        socket.on("connect_error", () => {
          if (!active) return;
          setConnectionState("error");
        });

        socket.on("new_notification", (notification: NotificationItem) => {
          if (!active) return;
          queryClient.setQueryData<NotificationsPayload>(
            notificationsQueryKey,
            (current) => {
              const nextItems = dedupeNotifications([
                notification,
                ...(current?.items || []),
              ]);
              return {
                items: nextItems,
                unreadCount: nextItems.filter(isUnreadNotification).length,
              };
            },
          );
          invalidateUnread();
          setSocketMessage("Có thông báo mới.");
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          ).catch(() => {});
          Vibration.vibrate([0, 250, 250, 250]);
          Notifications.scheduleNotificationAsync({
            content: {
              title: notification.title || 'Thông báo mới',
              body: notification.content || notification.message || 'Bạn vừa nhận được một thông báo mới.',
              sound: true,
            },
            trigger: null,
          });
        });
      })
      .catch(() => {
        if (!active) return;
        setConnectionState("error");
      });

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && socket) {
        if (!socket.connected) {
          socket.connect();
        }
      }
    });

    return () => {
      active = false;
      subscription.remove();
      if (socket) {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.off("new_notification");
        socket.disconnect();
      }
    };
  }, [queryClient]);

  const refreshAll = () => {
    notificationsQuery.refetch();
    invalidateUnread();
  };

  const openNotification = (item: NotificationItem) => {
    const id = Number(item.id);
    if (Number.isFinite(id) && id > 0 && isUnreadNotification(item)) {
      markRead.mutate(id);
    }

    const target = getNotificationTarget(item);
    if (target) {
      Haptics.selectionAsync().catch(() => {});
      router.push(target);
    }
  };

  return (
    <FlashList
      data={notifications}
      keyExtractor={(item: NotificationItem, index) =>
        stableKey(item.id, `notification-${index}`)
      }
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      refreshing={notificationsQuery.isRefetching}
      onRefresh={refreshAll}
      ListHeaderComponent={
        <View style={styles.headerWrap}>
          <CustomerHeader
            title="Thông báo"
            subtitle={
              unreadCount > 0
                ? `${unreadCount} thông báo chưa đọc`
                : "Bạn đã đọc hết thông báo"
            }
            onBack={() => router.back()}
            action={
              <Button
                mode="text"
                compact
                loading={markAll.isPending}
                disabled={markAll.isPending || unreadCount === 0}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
                    () => {},
                  );
                  markAll.mutate();
                }}
              >
                Đọc tất cả
              </Button>
            }
          />
          {socketMessage ? (
            <InlineMessage tone="success" message={socketMessage} />
          ) : null}
          {connectionState === "error" ? (
            <InlineMessage
              tone="warning"
              message="Realtime thông báo chưa sẵn sàng. Kéo để làm mới danh sách."
            />
          ) : null}
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
                  onPress={() => setReadFilter(item.key as typeof readFilter)}
                  style={styles.filterChip}
                >
                  {item.label}
                </Chip>
              ))}
            </View>
            <TextInput
              label="Lọc theo loại"
              mode="outlined"
              dense
              value={typeFilter}
              onChangeText={setTypeFilter}
              placeholder="BOOKING, QUOTE..."
            />
          </View>
          {notificationsQuery.isError ? (
            <View style={styles.errorBlock}>
              <InlineMessage tone="error" message="Không thể tải thông báo." />
              <Button
                mode="outlined"
                icon="refresh"
                onPress={refreshAll}
                style={styles.roundedButton}
              >
                Thử lại
              </Button>
            </View>
          ) : null}
          {notificationsQuery.isLoading ? <NotificationSkeleton /> : null}
        </View>
      }
      ListEmptyComponent={
        !notificationsQuery.isLoading ? (
          <EmptyState
            icon="bell-outline"
            title="Chưa có thông báo"
            description="Các cập nhật về đơn hàng và dịch vụ sẽ xuất hiện tại đây."
          />
        ) : null
      }
      renderItem={({ item }: { item: NotificationItem }) => (
        <NotificationCard
          item={item}
          deleting={
            deleteNotification.isPending &&
            deleteNotification.variables === Number(item.id)
          }
          onPress={() => openNotification(item)}
          onDelete={() => {
            const id = Number(item.id);
            if (Number.isFinite(id) && id > 0) deleteNotification.mutate(id);
          }}
        />
      )}
    />
  );
}

function NotificationCard({
  item,
  deleting,
  onPress,
  onDelete,
}: {
  item: NotificationItem;
  deleting: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const unread = isUnreadNotification(item);
  const color = getNotificationTone(item.type, activeColors);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (unread) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );
      anim.start();
      return () => anim.stop();
    }
  }, [unread]);

  return (
    <CustomerCard
      onPress={onPress}
      style={
        unread ? [styles.unreadCard, { borderColor: `${color}33` }] : undefined
      }
      accessibilityLabel={`Mở thông báo ${item.title || ""}`}
      accessibilityHint="Đánh dấu đã đọc và mở nội dung liên quan nếu có"
    >
      {unread ? (
        <View style={[styles.verticalIndicator, { backgroundColor: color }]} />
      ) : null}
      <View style={styles.notificationRow}>
        <View style={[styles.iconBubble, { backgroundColor: `${color}14` }]}>
          <MaterialCommunityIcons
            name={getNotificationIcon(item.type)}
            size={22}
            color={color}
          />
        </View>
        <View style={styles.notificationBody}>
          <View style={styles.rowBetween}>
            <Text
              variant="titleSmall"
              style={[styles.titleText, unread ? styles.unreadTitle : null]}
              numberOfLines={2}
            >
              {item.title || "Thông báo"}
            </Text>
            {unread ? (
              <Animated.View
                style={[
                  styles.unreadDot,
                  { backgroundColor: color, opacity: pulseAnim },
                ]}
              />
            ) : null}
            <IconButton
              icon="trash-can-outline"
              size={18}
              loading={deleting}
              disabled={deleting}
              iconColor={activeColors.error}
              onPress={onDelete}
              accessibilityLabel="Xóa thông báo"
              style={styles.deleteButton}
            />
          </View>
          <Text
            variant="bodySmall"
            style={styles.contentText}
            numberOfLines={3}
          >
            {item.content || item.message || "Bạn có cập nhật mới."}
          </Text>
          <View style={styles.metaRow}>
            {item.type ? (
              <Text
                variant="labelSmall"
                style={styles.typeText}
                numberOfLines={1}
              >
                {item.type}
              </Text>
            ) : null}
            {item.createdAt ? (
              <Text variant="labelSmall" style={styles.timeText}>
                {formatNotificationTime(item.createdAt)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </CustomerCard>
  );
}

function NotificationSkeleton() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2, 3].map((item) => (
        <CustomerCard key={item}>
          <View style={styles.notificationRow}>
            <View style={[styles.skeleton, styles.iconSkeleton]} />
            <View style={styles.notificationBody}>
              <View style={[styles.skeleton, { height: 18, width: "72%" }]} />
              <View style={[styles.skeleton, { height: 14, width: "92%" }]} />
              <View style={[styles.skeleton, { height: 14, width: "48%" }]} />
            </View>
          </View>
        </CustomerCard>
      ))}
    </View>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  listContent: { padding: 16, paddingBottom: 80 },
  headerWrap: { gap: 12, marginBottom: 12 },
  filterCard: {
    gap: 10,
    padding: 12,
    backgroundColor: activeColors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: activeColors.border,
  },
  filterChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filterChip: { borderRadius: 999 },
  errorBlock: { gap: 10 },
  notificationRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  notificationBody: { flex: 1, gap: 6 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: { color: activeColors.text, fontWeight: "800", flex: 1 },
  unreadTitle: { fontWeight: "900" },
  contentText: { color: activeColors.textSecondary, lineHeight: 19 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  typeText: { color: activeColors.textSecondary, fontWeight: "800", flex: 1 },
  timeText: { color: activeColors.textSecondary },
  unreadCard: { backgroundColor: "#F3F8FF" },
  unreadDot: { width: 9, height: 9, borderRadius: 5, marginTop: 4 },
  deleteButton: { margin: -8 },
  roundedButton: { alignSelf: "flex-start", borderRadius: 12 },
  skeletonWrap: { gap: 12 },
  skeleton: { backgroundColor: activeColors.surfaceVariant, borderRadius: 10 },
  iconSkeleton: { width: 44, height: 44, borderRadius: 22 },
  verticalIndicator: {
    position: "absolute",
    left: -16,
    top: -16,
    bottom: -16,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
});
