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

