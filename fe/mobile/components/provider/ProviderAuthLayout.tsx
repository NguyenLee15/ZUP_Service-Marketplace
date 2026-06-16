import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card, useTheme, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.lg },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  cardContent: { padding: Spacing.lg },
  message: { flexDirection: 'row', gap: 8, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'flex-start' },
  messageText: { flex: 1, fontWeight: '600', lineHeight: 18 },
});

export function ProviderAuthScreen({
  children,
  scroll = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  if (!scroll) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom }, contentStyle]}>
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: 82 + Math.min(Math.max(insets.bottom, 6), 18) },
        contentStyle,
      ]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {children}
    </ScrollView>
  );
}

export function ProviderAuthCard({
  children,
  style,
  contentStyle,
  onPress,
  accessibilityLabel,
  accessibilityHint,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}) {
  const theme = useTheme();

  return (
    <Card
      mode="contained"
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
          shadowColor: '#000000',
          shadowOpacity: theme.dark ? 0.18 : 0.06,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: theme.dark ? 1 : 2,
        },
        style,
      ]}
    >
      <Card.Content style={[styles.cardContent, contentStyle]}>{children}</Card.Content>
    </Card>
  );
}

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Tone = 'info' | 'success' | 'warning' | 'error' | 'neutral';

const toneIcon: Record<Tone, IconName> = {
  info: 'information-outline',
  success: 'check-circle-outline',
  warning: 'alert-outline',
  error: 'alert-circle-outline',
  neutral: 'information-outline',
};

export function ProviderInlineMessage({
  message,
  tone = 'info',
}: {
  message: string;
  tone?: Tone;
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
      <MaterialCommunityIcons name={toneIcon[tone]} size={18} color={color} />
      <Text variant="bodySmall" style={[styles.messageText, { color }]}>
        {message}
      </Text>
    </View>
  );
}
