import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';
import { Spacing } from '../../constants/spacing';

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: Spacing.lg, gap: Spacing.lg },
});

export function CustomerScreen({
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
        { paddingBottom: 82 + Math.max(insets.bottom, 12) + 8 },
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

