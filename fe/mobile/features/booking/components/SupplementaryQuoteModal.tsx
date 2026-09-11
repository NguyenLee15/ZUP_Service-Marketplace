import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Colors } from "../../../constants/colors";
import { ProviderInlineMessage } from "../../../components/provider/provider-ui";
import { type QuotationItem } from "./QuotationSheetModal";

interface SupplementaryQuoteModalProps {
  visible: boolean;
  suppQuoteError: string;
  suppQuoteItems: QuotationItem[];
  newItemName: string;
  newItemUnit: string;
  newItemPrice: string;
  newItemQty: string;
  suppQuoteNote: string;
  actionLoading: boolean;
  onDismiss: () => void;
  onUpdateSuppItemQty: (index: number, qty: number) => void;
  onRemoveSuppQuoteItem: (index: number) => void;
  onChangeNewItemName: (v: string) => void;
  onChangeNewItemUnit: (v: string) => void;
  onChangeNewItemPrice: (v: string) => void;
  onChangeNewItemQty: (v: string) => void;
  onAddSuppItem: () => void;
  onChangeNote: (v: string) => void;
  onSendSuppQuote: () => void;
}

export function SupplementaryQuoteModal({
  visible,
  suppQuoteError,
  suppQuoteItems,
  newItemName,
  newItemUnit,
  newItemPrice,
  newItemQty,
  suppQuoteNote,
  actionLoading,
  onDismiss,
  onUpdateSuppItemQty,
  onRemoveSuppQuoteItem,
  onChangeNewItemName,
  onChangeNewItemUnit,
  onChangeNewItemPrice,
  onChangeNewItemQty,
  onAddSuppItem,
  onChangeNote,
  onSendSuppQuote,
}: SupplementaryQuoteModalProps) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

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
        <Text variant="titleMedium" style={styles.modalTitle}>
          Gửi báo giá phát sinh
        </Text>
        {suppQuoteError ? (
          <ProviderInlineMessage tone="error" message={suppQuoteError} />
        ) : null}

        <Text
          variant="labelMedium"
          style={{
            color: activeColors.textSecondary,
            fontWeight: "700",
            marginTop: 4,
          }}
        >
          Chi tiết hạng mục bổ sung:
        </Text>
        <ScrollView
          style={styles.modalItemsScroll}
          contentContainerStyle={{ gap: 8 }}
        >
          {suppQuoteItems.map((item, index) => (
            <View key={index} style={styles.modalItemRow}>
              <View style={{ flex: 1 }}>
                <Text
                  variant="bodyMedium"
                  style={{ fontWeight: "700", color: activeColors.text }}
                >
                  {item.name}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: activeColors.textTertiary }}
                >
                  {formatPrice(item.price)} / {item.unit}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <IconButton
                  icon="minus-circle-outline"
                  size={22}
                  onPress={() =>
                    onUpdateSuppItemQty(index, item.quantity - 1)
                  }
                  style={{ margin: 0 }}
                />
                <Text
                  variant="bodyMedium"
                  style={{
                    fontWeight: "700",
                    minWidth: 20,
                    textAlign: "center",
                    color: activeColors.text,
                  }}
                >
                  {item.quantity}
                </Text>
                <IconButton
                  icon="plus-circle-outline"
                  size={22}
                  onPress={() =>
                    onUpdateSuppItemQty(index, item.quantity + 1)
                  }
                  style={{ margin: 0 }}
                />
                <IconButton
                  icon="trash-can-outline"
                  iconColor={activeColors.error}
                  size={20}
                  onPress={() => onRemoveSuppQuoteItem(index)}
                  style={{ margin: 0 }}
                />
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.addItemSection}>
          <Text
            variant="labelMedium"
            style={{ color: activeColors.primaryLight, fontWeight: "700" }}
          >
            + Thêm hạng mục:
          </Text>
          <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
            <TextInput
              label="Tên hạng mục"
              value={newItemName}
              onChangeText={onChangeNewItemName}
              mode="outlined"
              style={{ flex: 2 }}
              dense
            />
            <TextInput
              label="Đơn vị"
              value={newItemUnit}
              onChangeText={onChangeNewItemUnit}
              mode="outlined"
              style={{ flex: 1 }}
              dense
              placeholder="mét, cái"
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              gap: 6,
              marginTop: 6,
              alignItems: "center",
            }}
          >
            <TextInput
              label="Đơn giá (đ)"
              value={newItemPrice}
              onChangeText={onChangeNewItemPrice}
              mode="outlined"
              keyboardType="numeric"
              style={{ flex: 2 }}
              dense
            />
            <TextInput
              label="Số lượng"
              value={newItemQty}
              onChangeText={onChangeNewItemQty}
              mode="outlined"
              keyboardType="numeric"
              style={{ flex: 1 }}
              dense
            />
            <Button
              mode="contained"
              onPress={onAddSuppItem}
              style={{
                borderRadius: 8,
                height: 40,
                justifyContent: "center",
              }}
              contentStyle={{ height: 40 }}
            >
              Thêm
            </Button>
          </View>
        </View>

        <View style={styles.modalTotalRow}>
          <Text variant="bodyMedium" style={styles.mutedText}>
            Tổng cộng phát sinh:
          </Text>
          <Text variant="titleMedium" style={styles.modalTotalText}>
            {formatPrice(
              suppQuoteItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0,
              ),
            )}
          </Text>
        </View>

        <TextInput
          label="Ghi chú thêm"
          value={suppQuoteNote}
          onChangeText={onChangeNote}
          mode="outlined"
          multiline
          numberOfLines={3}
          left={
            <TextInput.Icon
              icon="note-text"
              accessibilityLabel="Ghi chú"
            />
          }
        />
        <Button
          mode="contained"
          onPress={onSendSuppQuote}
          loading={actionLoading}
          disabled={actionLoading || suppQuoteItems.length === 0}
          style={styles.primaryButton}
          contentStyle={styles.actionContent}
        >
          {actionLoading ? "Đang gửi…" : "Gửi báo giá bổ sung"}
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
    maxHeight: "90%",
    gap: 10,
  },
  modalTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  modalItemsScroll: {
    maxHeight: 180,
    marginVertical: 4,
  },
  modalItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  addItemSection: {
    backgroundColor: "rgba(0,0,0,0.02)",
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  modalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  mutedText: {
    opacity: 0.7,
  },
  modalTotalText: {
    fontWeight: "800",
    color: "#2563eb",
  },
  primaryButton: {
    borderRadius: 8,
    marginTop: 4,
  },
  actionContent: {
    height: 44,
  },
});

