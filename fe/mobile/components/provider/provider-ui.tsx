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

const toneColor: Record<Tone, string> = {
  info: Colors.light.info,
  success: Colors.light.success,
  warning: Colors.light.warning,
  error: Colors.light.error,
  neutral: Colors.light.textSecondary,
};

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
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1 }}>
        <Text variant="headlineSmall" style={styles.pageTitle} selectable>
          {title}
        </Text>
        {subtitle && (
          <Text variant="bodyMedium" style={styles.pageSubtitle} selectable>
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
  return (
    <Card
      mode="contained"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, style]}
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
  const color = toneColor[tone];
  return (
    <ProviderCard style={styles.metricCard} contentStyle={styles.metricContent}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}16` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      {loading ? (
        <View style={styles.metricSkeleton} />
      ) : (
        <Text variant="titleMedium" style={styles.metricValue} numberOfLines={1} selectable>
          {value}
        </Text>
      )}
      <Text variant="labelSmall" style={styles.metricLabel} numberOfLines={1}>
        {label}
      </Text>
    </ProviderCard>
  );
}

export function ProviderStatusChip({
  label,
  color = Colors.light.primary,
  selected,
  onPress,
}: {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Chip
      compact
      selected={selected}
      showSelectedCheck={false}
      onPress={onPress}
      style={[
        styles.statusChip,
        { backgroundColor: selected ? color : `${color}16`, borderColor: `${color}40` },
      ]}
      textStyle={[styles.statusChipText, { color: selected ? '#FFFFFF' : color }]}
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
  const color = toneColor[tone];
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
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name={icon} size={34} color={Colors.light.textSecondary} />
      </View>
      <Text variant="titleMedium" style={styles.emptyTitle}>
        {title}
      </Text>
      {description && (
        <Text variant="bodySmall" style={styles.emptyDescription}>
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
  return (
    <View style={styles.loadingState}>
      <ActivityIndicator color={Colors.light.primary} />
      <Text variant="bodySmall" style={styles.loadingText}>
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
  return (
    <View style={styles.sectionHeader}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {title}
      </Text>
      {actionLabel && onAction && (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          style={({ pressed }) => [styles.sectionAction, pressed && { opacity: 0.72 }]}
        >
          <Text variant="labelMedium" style={styles.sectionActionText}>
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
    paddingBottom: 112,
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
    color: Colors.light.text,
    fontWeight: '700',
  },
  pageSubtitle: {
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    boxShadow: Colors.light.cardShadow,
  },
  cardContent: {
    padding: 16,
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
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    color: Colors.light.text,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    color: Colors.light.textSecondary,
  },
  metricSkeleton: {
    width: 82,
    height: 22,
    borderRadius: 6,
    backgroundColor: Colors.light.surfaceVariant,
  },
  statusChip: {
    borderWidth: 1,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
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
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.surfaceVariant,
    marginBottom: 12,
  },
  emptyTitle: {
    color: Colors.light.text,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyDescription: {
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyButton: {
    marginTop: 16,
    borderRadius: 999,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 40,
  },
  loadingText: {
    color: Colors.light.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  sectionAction: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  sectionActionText: {
    color: Colors.light.primary,
    fontWeight: '700',
  },
});
