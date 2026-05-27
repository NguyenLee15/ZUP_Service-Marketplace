import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const styles = StyleSheet.create({
  empty: { alignItems: 'center', padding: 28, gap: 8 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontWeight: '800', textAlign: 'center' },
  emptyDescription: { textAlign: 'center', lineHeight: 18 },
  emptyButton: { marginTop: 8, borderRadius: 999 },
  buttonContent: { minHeight: 44 },
});

export function EmptyState({
  icon = 'inbox-outline',
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.empty}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons name={icon} size={34} color={theme.colors.onSurfaceVariant} />
      </View>
      <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {description ? (
        <Text variant="bodySmall" style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button
          mode="contained"
          onPress={onAction}
          style={styles.emptyButton}
          contentStyle={styles.buttonContent}
          accessibilityLabel={actionLabel}
        >
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

