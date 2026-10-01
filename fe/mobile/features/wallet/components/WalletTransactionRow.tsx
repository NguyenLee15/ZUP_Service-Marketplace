import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProviderCard } from '../../../components/provider/provider-ui';
import type { WalletTransactionItem } from '../wallet.types';

type WalletTransactionRowProps = {
  item: WalletTransactionItem;
  color: string;
  mutedColor: string;
  label: string;
  statusLabel: string;
  formatCurrency: (amount: number) => string;
};

export function WalletTransactionRow({ item, color, mutedColor, label, statusLabel, formatCurrency }: WalletTransactionRowProps) {
  const isPositive = item.type === 'DEPOSIT';
  const amount = Math.abs(Number(item.amount || 0));

  return (
    <ProviderCard contentStyle={styles.content}>
      <View style={[styles.icon, { backgroundColor: `${color}16` }]}>
        <MaterialCommunityIcons name={isPositive ? 'arrow-down-bold' : 'arrow-up-bold'} size={22} color={color} />
      </View>
      <View style={styles.body}>
        <Text variant="bodyLarge" style={styles.title} numberOfLines={1}>{label}</Text>
        <Text variant="bodySmall" style={[styles.meta, { color: mutedColor }]}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
        {item.booking ? <Text variant="labelSmall" style={[styles.meta, { color: mutedColor }]} selectable>Đơn hàng #{item.booking.bookingCode}</Text> : null}
      </View>
      <View style={styles.right}>
        <Text variant="titleSmall" style={[styles.amount, { color: item.status === 'FAILED' ? mutedColor : color }]} selectable>
          {isPositive ? '+' : '-'}{formatCurrency(amount)}
        </Text>
        <View style={[styles.badge, { backgroundColor: `${color}14` }]}>
          <Text variant="labelSmall" style={[styles.badgeText, { color }]} numberOfLines={1}>{statusLabel}</Text>
        </View>
      </View>
    </ProviderCard>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  title: { fontWeight: '700' },
  meta: { lineHeight: 17 },
  right: { alignItems: 'flex-end', gap: 5 },
  amount: { fontWeight: '800' },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontWeight: '700' },
});
