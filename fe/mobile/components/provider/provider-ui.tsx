import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Card, Text, Button, Chip, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Tone = 'info' | 'success' | 'warning' | 'error' | 'neutral';

// Reusable dialog export
export { ProviderDialog } from './ProviderDialog';

export function ProviderScreen({
  children,
  scroll = false,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();

  if (scroll) {
    return (
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={[styles.scrollContent, contentStyle]}
        contentInsetAdjustmentBehavior="automatic"
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }, contentStyle]}>
      {children}
    </View>
  );
}

export function ProviderPageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1 }}>
        <Text variant="headlineSmall" style={[styles.pageTitle, { color: theme.colors.onSurface }]} selectable>
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodyMedium" style={[styles.pageSubtitle, { color: theme.colors.onSurfaceVariant }]} selectable>
            {subtitle}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}

export function ProviderCard({
  children,
  style,
  contentStyle,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  return (
    <Card
      mode="contained"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
          boxShadow: activeColors.cardShadow,
        },
        style,
      ]}
    >
      <Card.Content style={[styles.cardContent, contentStyle]}>{children}</Card.Content>
    </Card>
  );
}

export function ProviderMetricCard({
  icon,
  label,
  value,
  tone = 'info',
  loading,
}: {
  icon: IconName;
  label: string;
  value: string;
  tone?: Tone;
  loading?: boolean;
}) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  const color = {
    info: activeColors.info,
    success: activeColors.success,
    warning: activeColors.warning,
    error: activeColors.error,
    neutral: activeColors.textSecondary,
  }[tone];

  return (
    <ProviderCard style={styles.metricCard} contentStyle={styles.metricContent}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}16` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      {loading ? (
        <View style={[styles.metricSkeleton, { backgroundColor: theme.colors.surfaceVariant }]} />
      ) : (
        <Text variant="titleMedium" style={[styles.metricValue, { color: theme.colors.onSurface }]} numberOfLines={1} selectable>
          {value}
        </Text>
      )}
      <Text variant="labelSmall" style={[styles.metricLabel, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>
        {label}
      </Text>
    </ProviderCard>
  );
}

export function ProviderStatusChip({
  label,
  color,
  selected,
  onPress,
}: {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const chipColor = color || theme.colors.primary;

  return (
    <Chip
      compact
      selected={selected}
      showSelectedCheck={false}
      onPress={onPress}
      style={[
        styles.statusChip,
        {
          backgroundColor: selected ? chipColor : `${chipColor}14`,
          borderColor: `${chipColor}45`,
        },
      ]}
      textStyle={[styles.statusChipText, { color: selected ? '#FFFFFF' : chipColor }]}
    >
      {label}
    </Chip>
  );
}

export function ProviderInlineMessage({
  message,
  tone = 'info',
  icon,
}: {
  message: string;
  tone?: Tone;
  icon?: IconName;
}) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  const color = {
    info: activeColors.info,
    success: activeColors.success,
    warning: activeColors.warning,
    error: activeColors.error,
    neutral: activeColors.textSecondary,
  }[tone];

  return (
    <View style={[styles.message, { backgroundColor: `${color}12`, borderColor: `${color}33` }]}>
      <MaterialCommunityIcons name={icon || 'information-outline'} size={18} color={color} />
      <Text variant="bodySmall" style={[styles.messageText, { color }]} selectable>
        {message}
      </Text>
    </View>
  );
}

export function ProviderEmptyState({
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
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.colors.surfaceVariant }]}>
        <MaterialCommunityIcons name={icon} size={34} color={theme.colors.onSurfaceVariant} />
      </View>
      <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {description && (
        <Text variant="bodySmall" style={[styles.emptyDescription, { color: theme.colors.onSurfaceVariant }]}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button mode="contained" onPress={onAction} style={styles.emptyButton}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

export function ProviderLoadingState({ label = 'Đang tải…' }: { label?: string }) {
  const theme = useTheme();

  return (
    <View style={styles.loadingState}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text variant="bodySmall" style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
    </View>
  );
}

export function ProviderSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [styles.sectionAction, pressed && { opacity: 0.72 }]}
        >
          <Text variant="labelMedium" style={[styles.sectionActionText, { color: theme.colors.primary }]}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 76,
    gap: 16,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 4,
  },
  pageTitle: {
    fontWeight: '700',
  },
  pageSubtitle: {
    marginTop: 2,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
  },
  cardContent: {
    padding: 14,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
  },
  metricContent: {
    alignItems: 'flex-start',
    gap: 8,
  },
  metricIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {},
  metricSkeleton: {
    width: 82,
    height: 22,
    borderRadius: 6,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 36,
    justifyContent: 'center',
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  messageText: {
    flex: 1,
    lineHeight: 18,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: 16,
    borderRadius: 10,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: {},
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionAction: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sectionActionText: {
    fontWeight: '700',
  },
});
