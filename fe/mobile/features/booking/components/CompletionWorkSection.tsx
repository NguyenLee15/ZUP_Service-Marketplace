import React from "react";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import { Button, IconButton, useTheme } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "../../../constants/colors";
import {
  ProviderCard,
  ProviderSectionHeader,
} from "../../../components/provider/provider-ui";

interface CompletionWorkSectionProps {
  status: string;
  resultImages: ImagePicker.ImagePickerAsset[];
  onPickImages: () => void;
  onTakePhoto: () => void;
  onRemoveImage: (index: number) => void;
}

export function CompletionWorkSection({
  status,
  resultImages,
  onPickImages,
  onTakePhoto,
  onRemoveImage,
}: CompletionWorkSectionProps) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  if (status !== "IN_PROGRESS") {
    return null;
  }

  return (
    <ProviderCard contentStyle={styles.formSection}>
      <ProviderSectionHeader title="Ảnh kết quả công việc" />
      <View style={styles.dualButtonRow}>
        <Button
          mode="outlined"
          icon="image-multiple"
          onPress={onPickImages}
          style={styles.flexButton}
        >
          Chọn ảnh
        </Button>
        <Button
          mode="outlined"
          icon="camera"
          onPress={onTakePhoto}
          style={styles.flexButton}
        >
          Chụp ảnh
        </Button>
      </View>
      {resultImages.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.evidenceRow}
        >
          {resultImages.map((image, index) => (
            <View key={`${image.uri}-${index}`} style={styles.imageTile}>
              <Image source={{ uri: image.uri }} style={styles.evidenceImage} />
              <IconButton
                icon="close"
                mode="contained"
                size={14}
                onPress={() => onRemoveImage(index)}
                accessibilityLabel="Xóa ảnh nghiệm thu"
                style={styles.removeImageButton}
                iconColor={activeColors.error}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </ProviderCard>
  );
}

const styles = StyleSheet.create({
  formSection: {
    gap: 10,
  },
  dualButtonRow: {
    flexDirection: "row",
    gap: 8,
  },
  flexButton: {
    flex: 1,
    borderRadius: 8,
  },
  evidenceRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 8,
  },
  imageTile: {
    position: "relative",
  },
  evidenceImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "#ffffff",
    elevation: 2,
    margin: 0,
  },
});

