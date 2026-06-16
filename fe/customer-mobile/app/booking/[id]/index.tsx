import { useActiveColors } from '../../../hooks/useActiveColors';
import { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button, Text, TextInput } from "react-native-paper";
import {
  ConfirmSheet,
  CustomerCard,
  EmptyState,
  InlineMessage,
  StatusChip,
  Timeline,
} from "../../../components/customer/customer-ui";
import {
  BOOKING_STATUS_COLOR,
  BOOKING_STATUS_LABEL,
} from "../../../constants/booking-status";
import { Colors } from "../../../constants/colors";
import { bookingApi } from "../../../features/booking/booking.api";
import { chatApi } from "../../../features/chat/chat.api";
import { getApiErrorMessage, unwrapData } from "../../../lib/api-response";
import { formatCurrency, formatDateTime } from "../../../lib/format";
import { toRouteId, routes } from "../../../lib/route-utils";
import { exportBookingReceiptPdf } from "../../../lib/customer-pdf-export";

type BookingActionType = "confirm" | "reject" | "cancel" | "accept" | "rebook";
type SheetType = "reject" | "cancel" | "accept" | null;

type BookingDetail = {
  id?: number | string;
  bookingCode?: string | null;
  status?: string | null;
  description?: string | null;
  desiredTime?: string | Date | null;
  addressDetail?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  quoteAmount?: number | string | null;
  actualPrice?: number | string | null;
  estimatedTime?: string | null;
  quoteNote?: string | null;
  note?: string | null;
  cancelReason?: string | null;
  rejectReason?: string | null;
  disputeReason?: string | null;
  service?: {
    id?: number | string;
    name?: string | null;
  } | null;
  provider?: {
    id?: number | string;
    fullName?: string | null;
    phone?: string | null;
  } | null;
};

type BookingTimelineItem = {
  id?: number | string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  createdAt?: string | Date | null;
};

const BASE_TIMELINE_STEPS = [
  {
    key: "PENDING",
    label: "Đã gửi yêu cầu",
    description: "Đang chờ nhà cung cấp xác nhận.",
  },
  {
    key: "ACCEPTED",
    label: "Nhà cung cấp đã nhận",
    description: "Nhà cung cấp sẽ liên hệ hoặc khảo sát.",
  },
  {
    key: "SURVEYING",
    label: "Đang khảo sát",
    description: "Nhà cung cấp đang kiểm tra nhu cầu thực tế.",
  },
  {
    key: "QUOTED",
    label: "Đã có báo giá",
    description: "Bạn có thể xác nhận hoặc từ chối báo giá.",
  },
  {
    key: "CONFIRMED",
    label: "Đã xác nhận",
    description: "Lịch hẹn đã được chốt.",
  },
  {
    key: "IN_PROGRESS",
    label: "Đang thực hiện",
    description: "Theo dõi tiến độ và vị trí nếu có.",
  },
  {
    key: "DONE",
    label: "Hoàn thành",
    description: "Bạn có thể nghiệm thu và đánh giá.",
  },
];

const TERMINAL_STEPS: Record<string, { label: string; description: string }> = {
  CANCELLED: { label: "Đã hủy", description: "Đơn hàng đã được hủy." },
  DISPUTED: {
    label: "Đang tranh chấp",
    description: "Đơn hàng đang được xử lý tranh chấp.",
  },
  REJECTED: { label: "Đã từ chối", description: "Yêu cầu đã bị từ chối." },
};

function isValidBookingId(value: number) {
  return Number.isFinite(value) && value > 0;
}

function getQuoteAmount(booking?: BookingDetail | null) {
  return booking?.quoteAmount || booking?.actualPrice || null;
}

function getTimelineSteps(status?: string | null) {
  if (status && TERMINAL_STEPS[status]) {
    return [
      ...BASE_TIMELINE_STEPS.slice(0, 2),
      { key: status, ...TERMINAL_STEPS[status] },
    ];
  }
  return BASE_TIMELINE_STEPS;
}

function getTimelineStepsFromHistory(history?: BookingTimelineItem[]) {
  if (!history?.length) return [];
  return history.map((item, index) => {
    const nextStatus = item.toStatus || item.fromStatus || "PENDING";
    const createdAt = item.createdAt ? formatDateTime(item.createdAt) : null;
    return {
      key: `${nextStatus}-${item.id || index}`,
      label: BOOKING_STATUS_LABEL[nextStatus] || nextStatus,
      description: [item.note, createdAt].filter(Boolean).join(" · "),
    };
  });
}

function getConversationId(payload: unknown) {
  const data: any = unwrapData(payload);
  return (
    data?.id ??
    data?.conversation?.id ??
    data?.data?.id ??
    data?.data?.conversation?.id
  );
}

function getRebookTargetId(payload: unknown) {
  const data: any = unwrapData(payload);
  return (
    data?.id ?? data?.booking?.id ?? data?.data?.id ?? data?.data?.booking?.id
  );
}

function getMessageTone(message: string): "success" | "error" {
  return message.includes("Không") || message.includes("Vui lòng")
    ? "error"
    : "success";
}

function canCancelBooking(status?: string | null) {
  // Business rule: chỉ hủy được ở PENDING và QUOTED
  return ["PENDING", "QUOTED"].includes(String(status || ""));
}

function fullAddress(booking: BookingDetail) {
  return [
    booking.addressDetail,
    booking.ward,
    booking.district,
    booking.province,
  ]
    .filter(Boolean)
    .join(", ");
}

export default function BookingDetailScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const bookingId = Number(id);
  const validBookingId = isValidBookingId(bookingId);
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [sheet, setSheet] = useState<SheetType>(null);
  const [message, setMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const bookingQuery = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: async () =>
      unwrapData<BookingDetail>(await bookingApi.getById(bookingId)),
    enabled: validBookingId,
  });

  const timelineQuery = useQuery({
    queryKey: ["booking", bookingId, "timeline"],
    queryFn: async () =>
      unwrapData<BookingTimelineItem[]>(
        await bookingApi.getTimeline(bookingId),
      ),
    enabled: validBookingId,
  });

  const booking = bookingQuery.data;
  const quoteAmount = getQuoteAmount(booking);
  const historyTimelineSteps = useMemo(
    () => getTimelineStepsFromHistory(timelineQuery.data),
    [timelineQuery.data],
  );
  const timelineSteps = useMemo(
    () =>
      historyTimelineSteps.length > 0
        ? historyTimelineSteps
        : getTimelineSteps(booking?.status),
    [booking?.status, historyTimelineSteps],
  );
  const timelineStatus =
    historyTimelineSteps.length > 0
      ? historyTimelineSteps[historyTimelineSteps.length - 1]?.key
      : booking?.status;

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] }),
      queryClient.invalidateQueries({
        queryKey: ["booking", bookingId, "timeline"],
      }),
      queryClient.invalidateQueries({ queryKey: ["bookings"] }),
    ]);
  };

  const actionMutation = useMutation({
    mutationFn: async ({ type }: { type: BookingActionType }) => {
      if (type === "confirm") return bookingApi.confirmQuote(bookingId);
      if (type === "reject")
        return bookingApi.rejectQuote(bookingId, reason.trim());
      if (type === "cancel")
        return bookingApi.cancelByCustomer(bookingId, reason.trim());
      if (type === "accept") return bookingApi.acceptCompletion(bookingId);
      return bookingApi.rebook(bookingId);
    },
    onSuccess: async (response, variables) => {
      setSheet(null);
      setReason("");
      await invalidate();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      if (variables.type === "rebook") {
        const nextId = toRouteId(getRebookTargetId(response));
        setMessage("Đã tạo lại đơn từ đơn cũ.");
        if (nextId) {
          router.push(routes.booking.detail(nextId));
        }
        return;
      }
      setMessage("Đã cập nhật đơn hàng.");
    },
    onError: (err) => {
      setMessage(getApiErrorMessage(err, "Không thể xử lý yêu cầu."));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
    },
  });

  const openChat = async () => {
    setMessage("");
    setChatLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const res = await chatApi.getOrCreateConversation({ bookingId });
      const conversationId = toRouteId(getConversationId(res));
      if (!conversationId) throw new Error("Missing conversation id");
      router.push(
        routes.chatRoom(
          conversationId,
          booking?.provider?.fullName || "Nhà cung cấp",
        ),
      );
    } catch (err) {
      setMessage(getApiErrorMessage(err, "Không thể mở tin nhắn."));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
    } finally {
      setChatLoading(false);
    }
  };

  const confirmSheetAction = () => {
    if (sheet === "accept") {
      actionMutation.mutate({ type: "accept" });
      return;
    }
    if (!reason.trim()) {
      setMessage("Vui lòng nhập lý do trước khi xác nhận.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
        () => {},
      );
      return;
    }
    actionMutation.mutate({ type: sheet === "reject" ? "reject" : "cancel" });
  };

  const handleExportReceipt = async () => {
    if (!booking) return;
    setMessage("");
    setExportingPdf(true);
    try {
      await exportBookingReceiptPdf(booking);
      setMessage("Đã tạo biên nhận PDF.");
    } catch {
      setMessage("Không thể xuất biên nhận PDF. Vui lòng thử lại sau.");
    } finally {
      setExportingPdf(false);
    }
  };

  if (!validBookingId) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="alert-circle-outline"
          title="Đơn hàng không hợp lệ"
          description="Vui lòng quay lại danh sách đơn hàng."
          actionLabel="Về đơn hàng"
          onAction={() => router.replace(routes.tabs.bookings)}
        />
      </View>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <DetailSkeleton />
      </ScrollView>
    );
  }

  if (bookingQuery.isError || !booking) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <InlineMessage
          tone="error"
          message="Không thể tải chi tiết đơn hàng."
        />
        <EmptyState
          icon="clipboard-alert-outline"
          title="Không tìm thấy đơn hàng"
          description="Đơn hàng có thể không tồn tại hoặc bạn không có quyền xem."
          actionLabel="Về đơn hàng"
          onAction={() => router.replace(routes.tabs.bookings)}
        />
        <Button
          mode="outlined"
          icon="refresh"
          onPress={() => bookingQuery.refetch()}
          style={styles.retryButton}
        >
          Thử lại
        </Button>
      </ScrollView>
    );
  }

  const status = booking.status || "PENDING";
  const statusColor =
    BOOKING_STATUS_COLOR[status] || activeColors.textSecondary;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={
          <RefreshControl
            refreshing={bookingQuery.isRefetching || timelineQuery.isRefetching}
            onRefresh={() => {
              bookingQuery.refetch();
              timelineQuery.refetch();
            }}
          />
        }
      >
        <View style={styles.headerBlock}>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Đơn #{booking.bookingCode || booking.id}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle} numberOfLines={1}>
            {booking.service?.name || "Dịch vụ"}
          </Text>
          <View style={styles.statusRow}>
            <StatusChip
              label={BOOKING_STATUS_LABEL[status] || status}
              color={statusColor}
            />
          </View>
        </View>

        {message ? (
          <InlineMessage tone={getMessageTone(message)} message={message} />
        ) : null}

        <SummaryCard booking={booking} statusColor={statusColor} />
        <Timeline status={timelineStatus || status} steps={timelineSteps} />

        {quoteAmount || status === "QUOTED" ? (
          <QuoteCard
            booking={booking}
            quoteAmount={quoteAmount}
            loading={actionMutation.isPending}
            onConfirm={() => actionMutation.mutate({ type: "confirm" })}
            onReject={() => setSheet("reject")}
          />
        ) : null}

        <ActionSection
          booking={booking}
          loading={actionMutation.isPending}
          chatLoading={chatLoading}
          exportLoading={exportingPdf}
          onCancel={() => setSheet("cancel")}
          onChat={openChat}
          onExportReceipt={handleExportReceipt}
          onTrack={() => router.push(routes.booking.track(String(bookingId)))}
          onReview={() => router.push(routes.booking.review(String(bookingId)))}
          onDispute={() =>
            router.push(routes.booking.dispute(String(bookingId)))
          }
          onAccept={() => setSheet("accept")}
          onRebook={() => actionMutation.mutate({ type: "rebook" })}
        />
      </ScrollView>

      <ConfirmSheet
        visible={sheet !== null}
        title={
          sheet === "accept"
            ? "Xác nhận hoàn thành"
            : sheet === "reject"
              ? "Từ chối báo giá"
              : "Hủy đơn hàng"
        }
        description={
          sheet === "accept"
            ? "Bạn xác nhận dịch vụ đã được thực hiện đúng thỏa thuận? Hệ thống sẽ trừ hoa hồng ngay sau khi xác nhận."
            : "Vui lòng nhập lý do để nhà cung cấp nắm được tình huống."
        }
        confirmLabel={
          sheet === "accept"
            ? "Xác nhận"
            : sheet === "reject"
              ? "Từ chối"
              : "Hủy đơn"
        }
        destructive={sheet !== "accept"}
        loading={actionMutation.isPending}
        onDismiss={() => {
          setSheet(null);
          setReason("");
        }}
        onConfirm={confirmSheetAction}
      >
        {sheet !== "accept" ? (
          <TextInput
            label="Lý do"
            mode="outlined"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
            autoFocus
          />
        ) : null}
      </ConfirmSheet>
    </View>
  );
}

function SummaryCard({
  booking,
  statusColor,
}: {
  booking: BookingDetail;
  statusColor: string;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const providerInitials = useMemo(() => {
    if (!booking.provider?.fullName) return "P";
    const parts = booking.provider.fullName.trim().split(/\s+/);
    return parts[parts.length - 1]?.charAt(0).toUpperCase() || "P";
  }, [booking.provider?.fullName]);

  return (
    <CustomerCard>
      <View style={styles.cardBlock}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text variant="labelSmall" style={styles.codeText} selectable>
              #{booking.bookingCode || booking.id}
            </Text>
            <Text
              variant="titleMedium"
              style={styles.titleText}
              numberOfLines={2}
            >
              {booking.service?.name || "Dịch vụ"}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="clipboard-text-outline"
            size={24}
            color={statusColor}
          />
        </View>

        <View style={styles.divider} />

        {booking.provider?.fullName ? (
          <>
            <View style={styles.providerRow}>
              <View style={styles.avatarInitials}>
                <Text style={styles.avatarText}>{providerInitials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="labelSmall" style={styles.infoLabel}>
                  Thợ đảm nhận
                </Text>
                <Text variant="bodyMedium" style={styles.infoValue}>
                  {booking.provider.fullName}
                </Text>
                {booking.provider.phone ? (
                  <Text variant="bodySmall" style={styles.subtitle}>
                    {booking.provider.phone}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        <InfoRow
          icon="calendar-clock"
          text={formatDateTime(booking.desiredTime)}
        />
        <View style={styles.divider} />

        {fullAddress(booking) ? (
          <>
            <InfoRow icon="map-marker-outline" text={fullAddress(booking)} />
            <View style={styles.divider} />
          </>
        ) : null}

        {booking.actualPrice ? (
          <>
            <View style={styles.priceRow}>
              <Text variant="labelSmall" style={styles.infoLabel}>
                Chi phí thực tế
              </Text>
              <Text variant="titleMedium" style={styles.actualPriceText}>
                {formatCurrency(booking.actualPrice)}
              </Text>
            </View>
            <View style={styles.divider} />
          </>
        ) : booking.quoteAmount ? (
          <>
            <View style={styles.priceRow}>
              <Text variant="labelSmall" style={styles.infoLabel}>
                Giá tạm tính
              </Text>
              <Text variant="titleMedium" style={styles.quotePriceText}>
                {formatCurrency(booking.quoteAmount)}
              </Text>
            </View>
            <View style={styles.divider} />
          </>
        ) : null}

        <View style={{ gap: 4 }}>
          <Text variant="labelSmall" style={styles.infoLabel}>
            Mô tả yêu cầu
          </Text>
          <Text
            variant="bodyMedium"
            style={styles.description}
            numberOfLines={5}
          >
            {booking.description || "Chưa có mô tả"}
          </Text>
        </View>
      </View>
    </CustomerCard>
  );
}

function QuoteCard({
  booking,
  quoteAmount,
  loading,
  onConfirm,
  onReject,
}: {
  booking: BookingDetail;
  quoteAmount: number | string | null;
  loading: boolean;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <CustomerCard style={styles.quoteCard}>
      <View style={styles.cardBlock}>
        <View style={styles.quoteHeader}>
          <MaterialCommunityIcons
            name="tag-outline"
            size={20}
            color={activeColors.primary}
          />
          <Text variant="titleMedium" style={styles.titleText}>
            Báo giá từ nhà cung cấp
          </Text>
        </View>
        <Text variant="headlineSmall" style={styles.priceText}>
          {quoteAmount ? formatCurrency(quoteAmount) : "Đang chờ báo giá"}
        </Text>
        {booking.estimatedTime ? (
          <InfoRow
            icon="timer-outline"
            text={`Thời gian dự kiến: ${booking.estimatedTime}`}
          />
        ) : null}
        {booking.quoteNote || booking.note ? (
          <Text variant="bodySmall" style={styles.description}>
            {booking.quoteNote || booking.note}
          </Text>
        ) : null}
        {booking.status === "QUOTED" ? (
          <View style={styles.actionRow}>
            <Button
              mode="contained"
              loading={loading}
              disabled={loading}
              onPress={onConfirm}
              style={styles.flexButton}
            >
              Xác nhận
            </Button>
            <Button
              mode="outlined"
              disabled={loading}
              onPress={onReject}
              style={styles.flexButton}
            >
              Từ chối
            </Button>
          </View>
        ) : null}
      </View>
    </CustomerCard>
  );
}

function ActionSection({
  booking,
  loading,
  chatLoading,
  exportLoading,
  onCancel,
  onChat,
  onExportReceipt,
  onTrack,
  onReview,
  onDispute,
  onAccept,
  onRebook,
}: {
  booking: BookingDetail;
  loading: boolean;
  chatLoading: boolean;
  exportLoading: boolean;
  onCancel: () => void;
  onChat: () => void;
  onExportReceipt: () => void;
  onTrack: () => void;
  onReview: () => void;
  onDispute: () => void;
  onAccept: () => void;
  onRebook: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const status = booking.status || "";
  return (
    <View style={styles.actions}>
      <ActionGroup title="Theo dõi & liên hệ">
        <Button
          mode="outlined"
          icon="file-pdf-box"
          loading={exportLoading}
          disabled={exportLoading}
          onPress={onExportReceipt}
          style={styles.actionButton}
        >
          Xuất biên nhận PDF
        </Button>
        <Button
          mode="outlined"
          icon="chat-outline"
          loading={chatLoading}
          disabled={chatLoading}
          onPress={onChat}
          style={styles.actionButton}
        >
          Nhắn tin nhà cung cấp
        </Button>
        {["CONFIRMED", "IN_PROGRESS", "DONE"].includes(status) ? (
          <Button
            mode="outlined"
            icon="map-marker-path"
            onPress={onTrack}
            style={styles.actionButton}
          >
            Theo dõi đơn
          </Button>
        ) : null}
      </ActionGroup>

      {status === "DONE" ? (
        <ActionGroup title="Hoàn tất">
          <Button
            mode="contained"
            icon="check-circle-outline"
            loading={loading}
            disabled={loading}
            onPress={onAccept}
            style={styles.actionButton}
          >
            Xác nhận hoàn thành
          </Button>
          <Button
            mode="outlined"
            icon="star-outline"
            onPress={onReview}
            style={styles.actionButton}
          >
            Đánh giá
          </Button>
        </ActionGroup>
      ) : null}

      <ActionGroup title="Khác">
        {canCancelBooking(status) ? (
          <Button
            mode="outlined"
            icon="close-circle-outline"
            disabled={loading}
            onPress={onCancel}
            style={[styles.actionButton, styles.dangerButton]}
            textColor={activeColors.error}
          >
            Hủy đơn
          </Button>
        ) : null}
        {["DONE", "DISPUTED"].includes(status) ? (
          status !== "DISPUTED" ? (
            <Button
              mode="outlined"
              icon="scale-balance"
              onPress={onDispute}
              style={styles.actionButton}
            >
              Gửi tranh chấp
            </Button>
          ) : (
            <InlineMessage
              tone="warning"
              message={
                booking.disputeReason ||
                "Đơn hàng đang trong trạng thái tranh chấp."
              }
            />
          )
        ) : null}
        {["CANCELLED", "REJECTED", "DONE"].includes(status) ? (
          <Button
            mode="text"
            icon="repeat"
            loading={loading}
            disabled={loading}
            onPress={onRebook}
            style={styles.actionButton}
          >
            Đặt lại dịch vụ này
          </Button>
        ) : null}
      </ActionGroup>
    </View>
  );
}

function ActionGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <CustomerCard>
      <View style={styles.cardBlock}>
        <Text variant="titleMedium" style={styles.titleText}>
          {title}
        </Text>
        {children}
      </View>
    </CustomerCard>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  text: string;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        name={icon}
        size={17}
        color={activeColors.textSecondary}
      />
      <Text variant="bodySmall" style={styles.infoText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function DetailSkeleton() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.cardBlock}>
      <View style={[styles.skeleton, { width: "68%", height: 26 }]} />
      <View style={[styles.skeleton, { width: "44%", height: 16 }]} />
      <CustomerCard>
        <View style={styles.cardBlock}>
          <View style={[styles.skeleton, { width: "34%", height: 14 }]} />
          <View style={[styles.skeleton, { width: "82%", height: 20 }]} />
          <View style={[styles.skeleton, { width: "94%", height: 14 }]} />
        </View>
      </CustomerCard>
      <CustomerCard>
        <View style={styles.cardBlock}>
          <View style={[styles.skeleton, { width: "40%", height: 20 }]} />
          <View style={[styles.skeleton, { width: "76%", height: 14 }]} />
          <View style={[styles.skeleton, { width: "60%", height: 14 }]} />
        </View>
      </CustomerCard>
    </View>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: activeColors.background },
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  headerBlock: { gap: 5 },
  headerTitle: { color: activeColors.text, fontWeight: "900" },
  subtitle: { color: activeColors.textSecondary, lineHeight: 20 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  cardBlock: { gap: 10 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  codeText: { color: activeColors.primary, fontWeight: "900" },
  titleText: { color: activeColors.text, fontWeight: "900" },
  description: { color: activeColors.textSecondary, lineHeight: 22 },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  infoText: { flex: 1, color: activeColors.textSecondary, lineHeight: 19 },
  priceText: { color: activeColors.primary, fontWeight: "900" },
  quoteCard: {
    borderColor: activeColors.primary,
    borderWidth: 2,
    backgroundColor: activeColors.primarySoft,
  },
  quoteHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionRow: { flexDirection: "row", gap: 10 },
  flexButton: { flex: 1, borderRadius: 12 },
  actions: { gap: 12 },
  actionButton: { borderRadius: 12 },
  dangerButton: { borderColor: `${activeColors.error}55` },
  retryButton: { alignSelf: "center", borderRadius: 12 },
  skeleton: { backgroundColor: activeColors.surfaceVariant, borderRadius: 10 },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  avatarInitials: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: activeColors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: activeColors.primary, fontWeight: "bold", fontSize: 16 },
  infoLabel: {
    color: activeColors.textSecondary,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: { color: activeColors.text, fontWeight: "700" },
  divider: {
    height: 1,
    backgroundColor: activeColors.border,
    marginVertical: 6,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  actualPriceText: { color: activeColors.success, fontWeight: "900" },
  quotePriceText: { color: activeColors.primary, fontWeight: "900" },
});
