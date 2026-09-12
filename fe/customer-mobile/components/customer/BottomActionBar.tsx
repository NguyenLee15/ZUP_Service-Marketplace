import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'react-native-paper';

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 10,
  },
});

export function BottomActionBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  return (
    <View
      style={[
        styles.bottomBar,
        {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          paddingBottom: 10 + Math.max(insets.bottom, 12),
        },
      ]}
    >
      {children}
    </View>
  );
}
