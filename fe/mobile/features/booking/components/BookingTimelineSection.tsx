import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import {
  BOOKING_STATUS_LABEL,
  type BookingStatus,
} from "../../../constants/booking-status";
import { Colors } from "../../../constants/colors";
import {
  ProviderCard,
  ProviderSectionHeader,
} from "../../../components/provider/provider-ui";

export type BookingTimelineItem = {
  id?: number | string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  createdAt?: string | Date | null;
  changedBy?: number | null;
};

export const getStatusColor = (
  status: string,
  activeColors: typeof Colors.light | typeof Colors.dark,
): string => {
  const map: Record<string, string> = {
    PENDING: activeColors.statusPending,
    ACCEPTED: activeColors.statusPending,
    QUOTED: activeColors.statusQuoted,
    CONFIRMED: activeColors.statusConfirmed,
    IN_PROGRESS: activeColors.statusInProgress,
    DONE: activeColors.statusDone,
    CANCELLED: activeColors.statusCancelled,
    DISPUTED: activeColors.statusDisputed,
  };
  return map[status] || activeColors.textSecondary;
};

const timelineStyles = StyleSheet.create({
  timelineList: {
    gap: 14,
    marginTop: 8,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  timelineTitle: {
    flex: 1,
    fontWeight: "800",
  },
  timelineTime: {},
  timelineNote: {
    marginTop: 4,
    lineHeight: 18,
  },
});

export function ProviderBookingTimeline({
  timeline,
  fallbackStatus,
  booking,
}: {
  timeline: BookingTimelineItem[];
  fallbackStatus?: string;
  booking?: any;
}) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const rows =
    timeline.length > 0
      ? timeline
      : fallbackStatus
        ? [{ toStatus: fallbackStatus }]
        : [];

  if (rows.length === 0) return null;

  return (
    <ProviderCard>
      <ProviderSectionHeader title="Timeline trạng thái" />
      <View style={timelineStyles.timelineList}>
        {rows.map((item, index) => {
          const status =
            item.toStatus || item.fromStatus || fallbackStatus || "PENDING";
          let label = BOOKING_STATUS_LABEL[status as BookingStatus] || status;
          if (item.note === "Đã đến nơi") {
            label = "Tôi đã đến";
          }
          const color = getStatusColor(status, activeColors);
          const createdAt = item.createdAt
            ? new Date(item.createdAt).toLocaleString("vi-VN")
            : "";

          let prefix = "";
          if (status === "CANCELLED" && item.changedBy) {
            if (item.changedBy === booking?.customerId)
              prefix = "Khách hàng hủy: ";
            else if (item.changedBy === booking?.providerId)
              prefix = "Bạn đã hủy: ";
            else prefix = "Hệ thống hủy: ";
          } else if (status === "CANCELLED" && !item.changedBy) {
            prefix = "Hệ thống hủy: ";
          }

          return (
            <View
              key={`${status}-${item.id || index}`}
              style={timelineStyles.timelineRow}
            >
              <View
                style={[timelineStyles.timelineDot, { backgroundColor: color }]}
              />
              <View
                style={[
                  timelineStyles.timelineContent,
                  { borderBottomColor: theme.colors.outlineVariant },
                ]}
              >
                <View style={timelineStyles.timelineHeader}>
                  <Text
                    variant="bodyMedium"
                    style={[
                      timelineStyles.timelineTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {label}
                  </Text>
                  {createdAt ? (
                    <Text
                      variant="labelSmall"
                      style={[
                        timelineStyles.timelineTime,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      {createdAt}
                    </Text>
                  ) : null}
                </View>
                {item.note ? (
                  <Text
                    variant="bodySmall"
                    style={[
                      timelineStyles.timelineNote,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {prefix}
                    {item.note}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </ProviderCard>
  );
}
