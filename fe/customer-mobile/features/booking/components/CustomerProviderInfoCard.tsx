import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { CustomerCard } from '../../../components/customer/customer-ui';
import { useActiveColors } from '../../../hooks/useActiveColors';
import { formatCurrency, formatDateTime } from '../../../lib/format';
import type { CustomerBookingDetail } from './customer-booking-detail.types';

function addressOf(booking: CustomerBookingDetail) {
  return [booking.addressDetail, booking.ward, booking.district, booking.province].filter(Boolean).join(', ');
}

export function CustomerProviderInfoCard({ booking, statusColor }: { booking: CustomerBookingDetail; statusColor: string }) {
  const colors = useActiveColors();
  const initials = useMemo(() => booking.provider?.fullName?.trim().split(/\s+/).at(-1)?.[0]?.toUpperCase() || 'P', [booking.provider?.fullName]);
  const address = addressOf(booking);
  return <CustomerCard><View style={styles.content}>
    <View style={styles.top}><View style={{ flex: 1 }}><Text variant="labelSmall" style={[styles.code, { color: colors.primary }]}>#{booking.bookingCode || booking.id}</Text><Text variant="titleMedium" style={[styles.title, { color: colors.text }]} numberOfLines={2}>{booking.service?.name || 'Dịch vụ'}</Text></View><MaterialCommunityIcons name="clipboard-text-outline" size={24} color={statusColor} /></View>
    {booking.provider?.fullName ? <View style={[styles.provider, { borderTopColor: colors.border }]}><View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}><Text style={{ color: colors.primary, fontWeight: '800' }}>{initials}</Text></View><View style={{ flex: 1 }}><Text variant="labelSmall" style={{ color: colors.textSecondary }}>THỢ ĐẢM NHẬN</Text><Text variant="bodyMedium" style={{ color: colors.text, fontWeight: '700' }}>{booking.provider.fullName}</Text>{booking.provider.phone ? <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{booking.provider.phone}</Text> : null}</View></View> : null}
    <Info icon="calendar-clock" text={formatDateTime(booking.desiredTime)} />
    {address ? <Info icon="map-marker-outline" text={address} /> : null}
    {booking.actualPrice || booking.quoteAmount ? <View style={styles.price}><Text variant="labelSmall" style={{ color: colors.textSecondary }}>{booking.actualPrice ? 'CHI PHÍ THỰC TẾ' : 'GIÁ TẠM TÍNH'}</Text><Text variant="titleMedium" style={{ color: booking.actualPrice ? colors.success : colors.primary, fontWeight: '900' }}>{formatCurrency(booking.actualPrice || booking.quoteAmount)}</Text></View> : null}
    <View><Text variant="labelSmall" style={{ color: colors.textSecondary }}>MÔ TẢ YÊU CẦU</Text><Text variant="bodyMedium" style={[styles.description, { color: colors.textSecondary }]} numberOfLines={5}>{booking.description || 'Chưa có mô tả'}</Text></View>
  </View></CustomerCard>;
}

function Info({ icon, text }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; text: string }) {
  const colors = useActiveColors();
  return <View style={styles.info}><MaterialCommunityIcons name={icon} size={17} color={colors.textSecondary} /><Text variant="bodySmall" style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>{text}</Text></View>;
}

const styles = StyleSheet.create({ content: { gap: 12 }, top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, code: { fontWeight: '900' }, title: { fontWeight: '900' }, provider: { flexDirection: 'row', gap: 10, borderTopWidth: 1, paddingTop: 12 }, avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' }, info: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' }, description: { flex: 1, lineHeight: 20 }, price: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } });
