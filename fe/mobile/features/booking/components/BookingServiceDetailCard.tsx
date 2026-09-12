import React from "react";
import { StyleSheet, View } from "react-native";
import { Text, useTheme } from "react-native-paper";
import {
  ProviderCard,
  ProviderSectionHeader,
} from "../../../components/provider/provider-ui";

interface BookingItem {
  id: number;
  name: string;
  unit: string;
  priceSnapshot?: number | string;
  quantity: number;
}

interface QuotationItem {
  id: number;
  name: string;
  unit: string;
  price?: number | string;
  quantity: number;
}

interface BookingServiceDetailCardProps {
  service?: {
    name?: string;
    category?: { name?: string };
    referencePrice?: number | string;
  } | null;
  bookingItems?: BookingItem[];
  quotation?: {
    actualPrice?: number | string;
    estimatedTime?: string | null;
    note?: string | null;
    quotationItems?: QuotationItem[];
  } | null;
  formatPrice: (price: number) => string;
}

export function BookingServiceDetailCard({
  service,
  bookingItems,
  quotation,
  formatPrice,
}: BookingServiceDetailCardProps) {
  const theme = useTheme();

  return (
    <View style={{ gap: 12 }}>
      <ProviderCard>
        <ProviderSectionHeader title="Dịch vụ yêu cầu" />
        <Text variant="titleMedium" style={styles.cardTitle} selectable>
          {service?.name || "Dịch vụ"}
        </Text>
        {service?.category?.name && (
          <Text variant="bodySmall" style={styles.mutedText}>
            {service.category.name}
          </Text>
        )}

        {Boolean(bookingItems && bookingItems.length > 0) && (
          <View style={styles.itemsContainer}>
            <Text variant="labelMedium" style={styles.itemsHeader}>
              Hạng mục chi tiết:
            </Text>
            {bookingItems!.map((item) => (
              <View key={item.id} style={styles.itemBadgeRow}>
                <View style={styles.itemBadgeTextContainer}>
                  <Text variant="bodyMedium" style={styles.itemBadgeName}>
                    {item.name}
                  </Text>
                  <Text variant="bodySmall" style={styles.itemBadgeUnit}>
                    Đơn giá: {formatPrice(Number(item.priceSnapshot || 0))} / {item.unit}
                  </Text>
                </View>
                <View style={styles.itemBadgeRight}>
                  <Text variant="bodyMedium" style={styles.itemBadgeQty}>
                    x{item.quantity}
                  </Text>
                  <Text variant="bodyMedium" style={styles.itemBadgeTotal}>
                    {formatPrice(Number(item.priceSnapshot || 0) * item.quantity)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ProviderCard>

      {Boolean(quotation) && (
        <ProviderCard>
          <ProviderSectionHeader title="Báo giá đã gửi" />
          <View style={styles.priceRow}>
            <Text variant="bodyMedium" style={styles.mutedText}>
              Giá thực tế
            </Text>
            <Text variant="titleMedium" style={styles.priceText} selectable>
              {formatPrice(Number(quotation?.actualPrice || 0))}
            </Text>
          </View>

          {Boolean(quotation?.estimatedTime) && (
            <View style={styles.priceRow}>
              <Text variant="bodyMedium" style={styles.mutedText}>
                Thời gian dự kiến
              </Text>
              <Text variant="bodyMedium" style={styles.cardTitle} selectable>
                {quotation!.estimatedTime}
              </Text>
            </View>
          )}

          {Boolean(quotation?.note) && (
            <View style={styles.noteBox}>
              <Text variant="bodySmall" style={styles.noteText}>
                {quotation!.note}
              </Text>
            </View>
          )}

          {Boolean(quotation?.quotationItems && quotation!.quotationItems.length > 0) && (
            <View style={styles.itemsContainer}>
              <Text variant="labelMedium" style={styles.itemsHeader}>
                Chi tiết hạng mục báo giá:
              </Text>
              {quotation!.quotationItems!.map((item) => {
                const isExtra = !bookingItems?.some(
                  (bi) => bi.name.toLowerCase() === item.name.toLowerCase()
                );
                return (
                  <View
                    key={item.id}
                    style={[styles.itemBadgeRow, isExtra && styles.extraItemBadgeRow]}
                  >
                    <View style={styles.itemBadgeTextContainer}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <Text variant="bodyMedium" style={styles.itemBadgeName}>
                          {item.name}
                        </Text>
                        {isExtra && (
                          <View style={styles.extraBadge}>
                            <Text style={styles.extraBadgeText}>Phát sinh</Text>
                          </View>
                        )}
                      </View>
                      <Text variant="bodySmall" style={styles.itemBadgeUnit}>
                        {formatPrice(Number(item.price || 0))} / {item.unit}
                      </Text>
                    </View>
                    <View style={styles.itemBadgeRight}>
                      <Text variant="bodyMedium" style={styles.itemBadgeQty}>
                        x{item.quantity}
                      </Text>
                      <Text variant="bodyMedium" style={styles.itemBadgeTotal}>
                        {formatPrice(Number(item.price || 0) * item.quantity)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ProviderCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontWeight: "700",
    marginTop: 4,
  },
  mutedText: {
    opacity: 0.7,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  priceText: {
    fontWeight: "800",
    color: "#2563eb",
  },
  itemsContainer: {
    marginTop: 10,
    gap: 8,
  },
  itemsHeader: {
    fontWeight: "700",
    marginBottom: 4,
  },
  itemBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  extraItemBadgeRow: {
    backgroundColor: "rgba(245, 158, 11, 0.08)",
  },
  itemBadgeTextContainer: {
    flex: 1,
  },
  itemBadgeName: {
    fontWeight: "600",
  },
  itemBadgeUnit: {
    opacity: 0.7,
  },
  itemBadgeRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  itemBadgeQty: {
    opacity: 0.7,
  },
  itemBadgeTotal: {
    fontWeight: "700",
  },
  extraBadge: {
    backgroundColor: "#f59e0b",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  extraBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  noteBox: {
    backgroundColor: "rgba(0,0,0,0.03)",
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  noteText: {
    lineHeight: 18,
    opacity: 0.85,
  },
});

