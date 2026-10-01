import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProviderCard } from '../../../components/provider/provider-ui';
import type { WalletRequest } from '../wallet.types';

type WalletRequestRowProps = {
  item: WalletRequest;
  type: 'deposit' | 'withdrawal';
  color: string;
  title: string;
  statusLabel: string;
  formatCurrency: (amount: number) => string;
};

export function WalletRequestRow({ item, type, color, title, statusLabel, formatCurrency }: WalletRequestRowProps) {
  const theme = useTheme();
  return (
    <ProviderCard style={styles.card} contentStyle={styles.content}>
      <View style={[styles.icon, { backgroundColor: `${color}16` }]}>
        <MaterialCommunityIcons name={type === 'deposit' ? 'bank-transfer-in' : 'bank-transfer-out'} size={22} color={color} />
      </View>
      <View style={styles.body}>
        <Text variant="bodyMedium" style={styles.title} numberOfLines={1}>{title} {formatCurrency(Number(item.amount || 0))}</Text>
        <Text variant="bodySmall" style={[styles.meta, { color: theme.colors.onSurfaceVariant }]} numberOfLines={1}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
        {item.adminNote ? <Text variant="labelSmall" style={[styles.meta, { color: theme.colors.onSurfaceVariant }]} numberOfLines={2}>{item.adminNote}</Text> : null}
      </View>
      <View style={[styles.badge, { backgroundColor: `${color}14` }]}>
        <Text variant="labelSmall" style={[styles.badgeText, { color }]} numberOfLines={1}>{statusLabel}</Text>
      </View>
    </ProviderCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 0 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  title: { fontWeight: '700' },
  meta: { lineHeight: 17 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontWeight: '700' },
});
