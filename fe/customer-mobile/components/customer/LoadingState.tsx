import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const styles = StyleSheet.create({
  loading: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 10 },
  subtitle: { lineHeight: 20 },
});

export function LoadingState({ label = 'Đang tải...' }: { label?: string }) {
  const theme = useTheme();

  return (
    <View style={styles.loading}>
      <ActivityIndicator color={theme.colors.primary} />
      <Text variant="bodySmall" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        {label}
      </Text>
    </View>
  );
}

