import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../../constants/colors";

interface BookingActionBarProps {
  status: string;
  actionLoading: boolean;
  canArrive?: boolean;
  hasResultImages?: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onArrive: () => void;
  onOpenQuote: () => void;
  onStart: () => void;
  onComplete: () => void;
  onOpenSuppQuote: () => void;
  onOpenCancel: () => void;
}

export function BookingActionBar({
  status,
  actionLoading,
  canArrive = true,
  hasResultImages = false,
  onAccept,
  onDecline,
  onArrive,
  onOpenQuote,
  onStart,
  onComplete,
  onOpenSuppQuote,
  onOpenCancel,
}: BookingActionBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  const hasBottomActions = [
    "PENDING",
    "ACCEPTED",
    "QUOTED",
    "CONFIRMED",
    "IN_PROGRESS",
  ].includes(status);

  if (!hasBottomActions) {
    return null;
  }

  return (
    <View
      style={[
        styles.actionFooter,
        {
          backgroundColor: theme.colors.surface,
          paddingBottom: Math.max(insets.bottom, 16),
          borderTopColor: "rgba(0,0,0,0.08)",
        },
      ]}
    >
      {status === "PENDING" && (
        <View style={styles.dualButtonRow}>
          <Button
            mode="outlined"
            onPress={onDecline}
            disabled={actionLoading}
            textColor={activeColors.error}
            style={[styles.actionButton, { borderColor: activeColors.error }]}
            icon="close-circle-outline"
            contentStyle={styles.actionContent}
          >
            Từ chối
          </Button>
          <Button
            mode="contained"
            onPress={onAccept}
            loading={actionLoading}
            disabled={actionLoading}
            style={styles.actionButton}
            icon="check-circle-outline"
            contentStyle={styles.actionContent}
          >
            Nhận đơn
          </Button>
        </View>
      )}

      {status === "ACCEPTED" && (
        <View style={styles.actionColumn}>
          {canArrive ? (
            <View style={styles.dualButtonRow}>
              <Button
                mode="contained"
                onPress={onArrive}
                loading={actionLoading}
                disabled={actionLoading}
                style={styles.actionButton}
                icon="map-marker-check-outline"
                contentStyle={styles.actionContent}
              >
                Tôi đã đến nơi
              </Button>
              <Button
                mode="outlined"
                onPress={onOpenCancel}
                textColor={activeColors.error}
                style={[styles.actionButton, { borderColor: activeColors.error }]}
                icon="close-circle-outline"
                contentStyle={styles.actionContent}
              >
                Hủy đơn
              </Button>
            </View>
          ) : (
            <View style={styles.dualButtonRow}>
              <Button
                mode="contained"
                onPress={onOpenQuote}
                style={styles.actionButton}
                icon="file-document-edit-outline"
                contentStyle={styles.actionContent}
              >
                Gửi báo giá
              </Button>
              <Button
                mode="outlined"
                onPress={onOpenCancel}
                textColor={activeColors.error}
                style={[styles.actionButton, { borderColor: activeColors.error }]}
                icon="close-circle-outline"
                contentStyle={styles.actionContent}
              >
                Hủy đơn
              </Button>
            </View>
          )}
        </View>
      )}

      {status === "QUOTED" && (
        <Button
          mode="outlined"
          onPress={onOpenCancel}
          textColor={activeColors.error}
          style={[styles.actionButton, styles.singleAction, { borderColor: activeColors.error }]}
          icon="close-circle-outline"
          contentStyle={styles.actionContent}
        >
          Hủy đơn
        </Button>
      )}

      {status === "CONFIRMED" && (
        <Button
          mode="contained"
          onPress={onStart}
          loading={actionLoading}
          disabled={actionLoading}
          style={[styles.actionButton, styles.singleAction]}
          icon="play-circle-outline"
          contentStyle={styles.actionContent}
        >
          {actionLoading ? "Đang xử lý…" : "Bắt đầu thực hiện"}
        </Button>
      )}

      {status === "IN_PROGRESS" && (
        <View style={{ gap: 8 }}>
          <Button
            mode="contained"
            onPress={onComplete}
            loading={actionLoading}
            disabled={actionLoading || !hasResultImages}
            style={[
              styles.actionButton,
              styles.singleAction,
              { backgroundColor: activeColors.success },
            ]}
            icon="check-circle-outline"
            contentStyle={styles.actionContent}
          >
            {actionLoading ? "Đang xử lý…" : "Hoàn thành công việc"}
          </Button>
          <Button
            mode="outlined"
            onPress={onOpenSuppQuote}
            disabled={actionLoading}
            style={[styles.actionButton, styles.singleAction]}
            icon="plus-circle-outline"
            contentStyle={styles.actionContent}
          >
            Báo giá phát sinh
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  actionFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dualButtonRow: {
    flexDirection: "row",
    gap: 12,
  },
  actionColumn: {
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 10,
  },
  singleAction: {
    width: "100%",
  },
  actionContent: {
    height: 46,
  },
});

