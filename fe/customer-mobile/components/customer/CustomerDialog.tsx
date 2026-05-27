import * as React from 'react';
import { StyleSheet } from 'react-native';
import { Button, Dialog, Portal, Text, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';

export function CustomerDialog({
  visible,
  title,
  description,
  confirmLabel = 'Đồng ý',
  cancelLabel = 'Đóng',
  onConfirm,
  onDismiss,
  destructive = false,
  loading = false,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onDismiss: () => void;
  destructive?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();

  React.useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [visible]);

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: theme.colors.surface }}>
        <Dialog.Title style={{ color: theme.colors.onSurface, fontWeight: '900' }}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
            {description}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button 
            onPress={onDismiss} 
            textColor={theme.colors.onSurfaceVariant}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          {onConfirm ? (
            <Button
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                onConfirm();
              }}
              loading={loading}
              disabled={loading}
              textColor={destructive ? theme.colors.error : theme.colors.primary}
            >
              {confirmLabel}
            </Button>
          ) : null}
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 8,
  },
});
