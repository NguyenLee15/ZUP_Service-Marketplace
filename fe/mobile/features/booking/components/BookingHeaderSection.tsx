import React from "react";
import { StyleSheet, View } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "../../../constants/colors";
import {
  BOOKING_STATUS_LABEL,
  type BookingStatus,
} from "../../../constants/booking-status";
import {
  ProviderCard,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderStatusChip,
} from "../../../components/provider/provider-ui";
import { getStatusColor } from "./BookingTimelineSection";

interface BookingHeaderSectionProps {
  bookingCode: string;
  status: string;
  desiredTime?: string | null;
  providerResponseDeadline?: string | null;
  message?: { tone: "success" | "warning" | "error" | "info"; text: string } | null;
  onBack: () => void;
}

export function BookingHeaderSection({
  bookingCode,
  status,
  desiredTime,
  providerResponseDeadline,
  message,
  onBack,
}: BookingHeaderSectionProps) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  const color = getStatusColor(status, activeColors);
  const statusLabel = BOOKING_STATUS_LABEL[status as BookingStatus] || status;
  const isAwaitingProviderAcceptance = status === "PENDING";
  const responseDeadline = providerResponseDeadline
    ? new Date(providerResponseDeadline).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <View style={styles.container}>
      <ProviderPageHeader
        title={`#${bookingCode}`}
        subtitle="Chi tiết đơn hàng và thao tác xử lý."
        action={
          <IconButton
            icon="arrow-left"
            mode="contained-tonal"
            onPress={onBack}
            accessibilityLabel="Quay lại"
          />
        }
      />

      {message && (
        <ProviderInlineMessage tone={message.tone} message={message.text} />
      )}

      <ProviderCard contentStyle={styles.statusCard}>
        <View style={styles.statusTopRow}>
          <View>
            <Text variant="labelLarge" style={styles.mutedText}>
              Trạng thái đơn
            </Text>
            <Text variant="titleMedium" style={styles.statusTitle}>
              {statusLabel}
            </Text>
          </View>
          <ProviderStatusChip label={statusLabel} color={color} selected />
        </View>

        <View style={styles.statusMetaRow}>
          <MaterialCommunityIcons
            name="calendar-clock-outline"
            size={18}
            color={activeColors.textSecondary}
          />
          <Text variant="bodySmall" style={styles.mutedText}>
            {desiredTime
              ? new Date(desiredTime).toLocaleString("vi-VN")
              : "Chưa có lịch hẹn"}
          </Text>
        </View>

        {isAwaitingProviderAcceptance && (
          <ProviderInlineMessage
            tone="warning"
            icon="timer-sand"
            message={`Đơn mới cần nhận trong 1 phút${
              responseDeadline ? `, hạn phản hồi ${responseDeadline}` : ""
            }.`}
          />
        )}
      </ProviderCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  statusCard: {
    gap: 12,
  },
  statusTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mutedText: {
    opacity: 0.7,
  },
  statusTitle: {
    fontWeight: "800",
    marginTop: 2,
  },
});

