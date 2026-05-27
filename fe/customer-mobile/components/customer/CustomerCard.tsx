import type { ReactNode } from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Card, useTheme } from 'react-native-paper';
import { Spacing, BorderRadius } from '../../constants/spacing';

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  cardContent: { padding: Spacing.lg },
});

export function CustomerCard({
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
          boxShadow: theme.dark ? '0 10px 30px rgba(0, 0, 0, 0.5)' : '0 10px 30px rgba(15, 23, 42, 0.08)',
        },
        style,
      ]}
    >
      <Card.Content style={[styles.cardContent, contentStyle]}>{children}</Card.Content>
    </Card>
  );
}

