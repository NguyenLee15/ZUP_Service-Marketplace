import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ProviderCard,
  ProviderSectionHeader,
} from "../../../components/provider/provider-ui";

interface SurveyorInfoCardProps {
  assignedSurveyorName?: string | null;
  assignedSurveyorPhone?: string | null;
  canAssign: boolean;
  surveyorName: string;
  surveyorPhone: string;
  actionLoading: boolean;
  onChangeSurveyorName: (val: string) => void;
  onChangeSurveyorPhone: (val: string) => void;
  onConfirmSurveyor: () => void;
}

export function SurveyorInfoCard({
  assignedSurveyorName,
  assignedSurveyorPhone,
  canAssign,
  surveyorName,
  surveyorPhone,
  actionLoading,
  onChangeSurveyorName,
  onChangeSurveyorPhone,
  onConfirmSurveyor,
}: SurveyorInfoCardProps) {
  const theme = useTheme();

  if (!canAssign && !assignedSurveyorName) {
    return null;
  }

  return (
    <ProviderCard contentStyle={styles.formSection}>
      <ProviderSectionHeader title="Thợ khảo sát" />
      {assignedSurveyorName ? (
        <View style={{ gap: 8 }}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="account-hard-hat"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyMedium" style={{ flex: 1 }} selectable>
              {assignedSurveyorName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="phone-outline"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Text variant="bodyMedium" style={{ flex: 1 }} selectable>
              {assignedSurveyorPhone || "Chưa có số điện thoại"}
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <TextInput
            label="Tên thợ khảo sát"
            value={surveyorName}
            onChangeText={onChangeSurveyorName}
            mode="outlined"
            left={
              <TextInput.Icon
                icon="account-hard-hat"
                accessibilityLabel="Tên thợ khảo sát"
              />
            }
          />
          <TextInput
            label="SĐT thợ khảo sát"
            value={surveyorPhone}
            onChangeText={onChangeSurveyorPhone}
            mode="outlined"
            keyboardType="phone-pad"
            left={
              <TextInput.Icon
                icon="phone"
                accessibilityLabel="Số điện thoại thợ khảo sát"
              />
            }
          />
          <Button
            mode="contained"
            onPress={onConfirmSurveyor}
            loading={actionLoading}
            disabled={actionLoading}
            style={styles.primaryButton}
            icon="check"
          >
            {actionLoading ? "Đang xử lý…" : "Xác nhận thợ khảo sát"}
          </Button>
        </View>
      )}
    </ProviderCard>
  );
}

const styles = StyleSheet.create({
  formSection: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  primaryButton: {
    borderRadius: 8,
    marginTop: 4,
  },
});

