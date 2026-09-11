import React from "react";
import { StyleSheet } from "react-native";
import { Button, Modal, Portal, Text, TextInput, useTheme } from "react-native-paper";
import { Colors } from "../../../constants/colors";
import { ProviderInlineMessage } from "../../../components/provider/provider-ui";

interface CancelBookingModalProps {
  visible: boolean;
  cancelReason: string;
  cancelError: string;
  actionLoading: boolean;
  onChangeReason: (text: string) => void;
  onDismiss: () => void;
  onConfirm: () => void;
}

export function CancelBookingModal({
  visible,
  cancelReason,
  cancelError,
  actionLoading,
  onChangeReason,
  onDismiss,
  onConfirm,
}: CancelBookingModalProps) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text
          variant="titleMedium"
          style={[styles.modalTitle, { color: activeColors.error }]}
        >
          Hủy đơn hàng
        </Text>
        {cancelError ? (
          <ProviderInlineMessage tone="error" message={cancelError} />
        ) : null}
        <TextInput
          label="Lý do hủy"
          value={cancelReason}
          onChangeText={onChangeReason}
          mode="outlined"
          multiline
          numberOfLines={3}
          left={
            <TextInput.Icon
              icon="alert-circle-outline"
              accessibilityLabel="Lý do hủy"
            />
          }
        />
        <Button
          mode="contained"
          onPress={onConfirm}
          loading={actionLoading}
          disabled={actionLoading || !cancelReason.trim()}
          style={[
            styles.primaryButton,
            { backgroundColor: activeColors.error },
          ]}
          contentStyle={styles.actionContent}
        >
          {actionLoading ? "Đang xử lý…" : "Xác nhận hủy"}
        </Button>
        <Button mode="text" onPress={onDismiss}>
          Đóng
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  modalTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  primaryButton: {
    borderRadius: 8,
    marginTop: 8,
  },
  actionContent: {
    height: 44,
  },
});

