import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';

const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    backgroundColor: '#FFFFFFF2',
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    flexDirection: 'row',
    gap: 10,
  },
});

export function BottomActionBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bottomBar, { paddingBottom: 12 + Math.max(insets.bottom, 10) }]}>{children}</View>;
}
