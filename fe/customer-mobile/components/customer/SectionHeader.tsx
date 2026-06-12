import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: { fontWeight: '900' },
  subtitle: { lineHeight: 20 },
});

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel && onAction ? (
        <Button mode="text" compact onPress={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}
