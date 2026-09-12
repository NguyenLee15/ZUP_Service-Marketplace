import React from "react";
import { Image, Linking, ScrollView, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ProviderCard,
  ProviderInlineMessage,
  ProviderSectionHeader,
} from "../../../components/provider/provider-ui";

interface CustomerDetailCardProps {
  customer?: {
    id?: number;
    fullName?: string;
    phone?: string;
    avatarUrl?: string;
  } | null;
  addressDetail?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  desiredTime?: string | null;
  note?: string | null;
  dispute?: any | null;
  status?: string;
}

export function CustomerDetailCard({
  customer,
  addressDetail,
  ward,
  district,
  province,
  desiredTime,
  note,
  dispute,
  status,
}: CustomerDetailCardProps) {
  const theme = useTheme();

  const fullAddress = [addressDetail, ward, district, province]
    .filter(Boolean)
    .filter((p) => p !== "Không áp dụng")
    .join(", ") || "Chưa có địa chỉ";

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleOpenMap = () => {
    if (fullAddress && fullAddress !== "Chưa có địa chỉ") {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        fullAddress
      )}`;
      Linking.openURL(url);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <ProviderCard>
        <ProviderSectionHeader title="Khách hàng" />

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="account-outline"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={styles.infoText} selectable>
            {customer?.fullName || "Khách hàng"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="phone-outline"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={styles.infoText} selectable>
            {customer?.phone || "Chưa có số điện thoại"}
          </Text>
          {Boolean(customer?.phone) && (
            <Button
              mode="text"
              compact
              icon="phone"
              onPress={handleCall}
              style={{ margin: 0 }}
            >
              Gọi
            </Button>
          )}
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="bodyMedium" style={styles.infoText} selectable>
            {fullAddress}
          </Text>
          {fullAddress !== "Chưa có địa chỉ" && (
            <Button
              mode="text"
              compact
              icon="directions"
              onPress={handleOpenMap}
              style={{ margin: 0 }}
            >
              Chỉ đường
            </Button>
          )}
        </View>

        {Boolean(desiredTime) && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyMedium" style={styles.infoText}>
              {new Date(desiredTime!).toLocaleString("vi-VN")}
            </Text>
          </View>
        )}

        {Boolean(note) && (
          <View style={styles.noteBox}>
            <Text variant="labelSmall" style={{ fontWeight: "700", marginBottom: 2 }}>
              Ghi chú của khách:
            </Text>
            <Text variant="bodySmall" style={styles.noteText}>
              {note}
            </Text>
          </View>
        )}
      </ProviderCard>

      {status === "DISPUTED" && dispute && (
        <ProviderCard style={styles.disputeCard}>
          <ProviderInlineMessage
            tone="error"
            icon="alert-decagram-outline"
            message={`Khiếu nại từ khách hàng: ${dispute.reason || "Đang xử lý"}`}
          />
          {dispute.aiSummary && (
            <View style={styles.noteBox}>
              <Text variant="labelMedium" style={{ fontWeight: "700" }}>
                Tóm tắt hệ thống
              </Text>
              <Text variant="bodySmall" style={styles.noteText}>
                {dispute.aiSummary}
              </Text>
            </View>
          )}
          {dispute.evidences?.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.evidenceRow}
            >
              {dispute.evidences.map((evidence: any, index: number) => (
                <Image
                  key={`${evidence.fileUrl}-${index}`}
                  source={{ uri: evidence.fileUrl }}
                  style={styles.evidenceImage}
                />
              ))}
            </ScrollView>
          )}
        </ProviderCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    lineHeight: 20,
  },
  noteBox: {
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  noteText: {
    lineHeight: 18,
    opacity: 0.85,
  },
  disputeCard: {
    borderColor: "#ef4444",
    borderWidth: 1,
    gap: 8,
  },
  evidenceRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 8,
  },
  evidenceImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
});

