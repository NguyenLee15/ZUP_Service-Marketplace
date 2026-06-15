import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const styles = StyleSheet.create({
  subtitle: { lineHeight: 20 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.36)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    gap: 14,
  },
  sheetActions: { flexDirection: 'row', gap: 10 },
  sheetButton: { flex: 1, borderRadius: 12 },
  buttonContent: { minHeight: 44 },
  sheetGrabber: {
    width: 42,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
  },
  sheetTitle: { fontWeight: '900' },
});

export function ConfirmSheet({
  visible,
  title,
  description,
  confirmLabel = 'Xác nhận',
  destructive,
  loading,
  children,
  onDismiss,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  children?: ReactNode;
  onDismiss: () => void;
  onConfirm: () => void;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalRoot}
      >
        <Pressable style={styles.modalBackdrop} onPress={onDismiss} />
        <View style={[styles.sheet, { backgroundColor: theme.colors.surface, paddingBottom: 16 + Math.min(Math.max(insets.bottom, 6), 18) }]}>
          <View style={[styles.sheetGrabber, { backgroundColor: theme.colors.outline }]} />
          <Text variant="titleLarge" style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          {description ? (
            <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              {description}
            </Text>
          ) : null}
          {children}
          <View style={styles.sheetActions}>
            <Button mode="outlined" onPress={onDismiss} style={styles.sheetButton} contentStyle={styles.buttonContent}>
              Đóng
            </Button>
            <Button
              mode="contained"
              loading={loading}
              disabled={loading}
              buttonColor={destructive ? activeColors.error : activeColors.primary}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                onConfirm();
              }}
              style={styles.sheetButton}
              contentStyle={styles.buttonContent}
            >
              {confirmLabel}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
