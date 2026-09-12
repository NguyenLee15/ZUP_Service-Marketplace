import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { Spacing } from '../../constants/spacing';

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.md },
  title: { fontWeight: '800' },
  subtitle: { lineHeight: 20 },
});

export function CustomerHeader({
  title,
  subtitle,
  action,
  onBack,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  onBack?: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.header}>
      {onBack && (
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={onBack}
          style={{ margin: 0, marginRight: 4, marginLeft: -4 }}
          accessibilityLabel="Quay lại"
        />
      )}
      <View style={{ flex: 1 }}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}
