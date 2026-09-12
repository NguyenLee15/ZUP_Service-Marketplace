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
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../../../constants/colors";
import { ProviderInlineMessage } from "../../../components/provider/provider-ui";

export interface QuotationItem {
  name: string;
  unit: string;
  price: number;
  quantity: number;
}

interface QuotationSheetModalProps {
  visible: boolean;
  quoteError: string;
  quoteItems: QuotationItem[];
  newItemName: string;
  newItemUnit: string;
  newItemPrice: string;
  newItemQty: string;
  quoteEstimatedTime: string;
  quoteNote: string;
  surveyImages: ImagePicker.ImagePickerAsset[];
  actionLoading: boolean;
  onDismiss: () => void;
  onUpdateItemQty: (index: number, qty: number) => void;
  onRemoveQuoteItem: (index: number) => void;
  onChangeNewItemName: (v: string) => void;
  onChangeNewItemUnit: (v: string) => void;
  onChangeNewItemPrice: (v: string) => void;
  onChangeNewItemQty: (v: string) => void;
  onAddNewItem: () => void;
  onChangeEstimatedTime: (v: string) => void;
  onChangeNote: (v: string) => void;
  onPickImages: () => void;
  onSendQuote: () => void;
}

export function QuotationSheetModal({
  visible,
  quoteError,
  quoteItems,
  newItemName,
  newItemUnit,
  newItemPrice,
  newItemQty,
  quoteEstimatedTime,
  quoteNote,
  surveyImages,
  actionLoading,
  onDismiss,
  onUpdateItemQty,
  onRemoveQuoteItem,
  onChangeNewItemName,
  onChangeNewItemUnit,
  onChangeNewItemPrice,
  onChangeNewItemQty,
  onAddNewItem,
  onChangeEstimatedTime,
  onChangeNote,
  onPickImages,
  onSendQuote,
}: QuotationSheetModalProps) {
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
          Gửi báo giá khảo sát
        </Text>
        {quoteError ? (
          <ProviderInlineMessage tone="error" message={quoteError} />
        ) : null}

        <Text
          variant="labelMedium"
          style={{
            color: activeColors.textSecondary,
            fontWeight: "700",
            marginTop: 4,
          }}
        >
          Chi tiết hạng mục báo giá:
        </Text>
        <ScrollView
          style={styles.modalItemsScroll}
          contentContainerStyle={{ gap: 8 }}
        >
          {quoteItems.map((item, index) => (
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
                  onPress={() => onUpdateItemQty(index, item.quantity - 1)}
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
                  onPress={() => onUpdateItemQty(index, item.quantity + 1)}
                  style={{ margin: 0 }}
                />
                <IconButton
                  icon="trash-can-outline"
                  iconColor={activeColors.error}
                  size={20}
                  onPress={() => onRemoveQuoteItem(index)}
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
            + Thêm hạng mục phát sinh:
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
              onPress={onAddNewItem}
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

        {(() => {
          const totalRawPrice = quoteItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
          );
          const estimatedCommission = Math.round(totalRawPrice * 0.1);
          const estimatedNetEarnings = totalRawPrice - estimatedCommission;
          return (
            <View style={styles.calculationCard}>
              <View style={styles.modalTotalRow}>
                <Text variant="bodySmall" style={styles.mutedText}>
                  Tổng giá dịch vụ:
                </Text>
                <Text variant="bodyMedium" style={{ fontWeight: "600" }}>
                  {formatPrice(totalRawPrice)}
                </Text>
              </View>
              <View style={[styles.modalTotalRow, { borderTopWidth: 0, paddingTop: 2 }]}>
                <Text variant="bodySmall" style={{ color: "#d97706" }}>
                  Phí hoa hồng sàn (~10%):
                </Text>
                <Text variant="bodySmall" style={{ color: "#d97706", fontWeight: "600" }}>
                  -{formatPrice(estimatedCommission)}
                </Text>
              </View>
              <View style={[styles.modalTotalRow, { paddingTop: 6, marginTop: 4, borderTopColor: "rgba(0,0,0,0.08)" }]}>
                <Text variant="bodyMedium" style={{ fontWeight: "700", color: activeColors.text }}>
                  Thực nhận ước tính:
                </Text>
                <Text variant="titleMedium" style={{ fontWeight: "800", color: "#16a34a" }}>
                  {formatPrice(estimatedNetEarnings)}
                </Text>
              </View>
            </View>
          );
        })()}

        <TextInput
          label="Thời gian dự kiến"
          value={quoteEstimatedTime}
          onChangeText={onChangeEstimatedTime}
          mode="outlined"
          maxLength={100}
          placeholder="Ví dụ: 2 giờ, 1 ngày"
          left={
            <TextInput.Icon
              icon="timer-outline"
              accessibilityLabel="Thời gian dự kiến"
            />
          }
        />
        <TextInput
          label="Ghi chú thêm"
          value={quoteNote}
          onChangeText={onChangeNote}
          mode="outlined"
          multiline
          numberOfLines={3}
          left={
            <TextInput.Icon
              icon="note-text"
              accessibilityLabel="Ghi chú báo giá"
            />
          }
        />
        <Button
          mode="outlined"
          icon="image"
          onPress={onPickImages}
          style={styles.primaryButton}
        >
          Ảnh khảo sát ({surveyImages.length})
        </Button>
        <Button
          mode="contained"
          onPress={onSendQuote}
          loading={actionLoading}
          disabled={
            actionLoading ||
            quoteItems.length === 0 ||
            !quoteEstimatedTime.trim()
          }
          style={styles.primaryButton}
          contentStyle={styles.actionContent}
        >
          {actionLoading ? "Đang gửi…" : "Gửi báo giá"}
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
  calculationCard: {
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 8,
    padding: 10,
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

