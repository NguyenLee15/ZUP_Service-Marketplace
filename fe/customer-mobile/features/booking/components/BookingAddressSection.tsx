import { Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomerCard, InlineMessage, SectionHeader, StatusChip } from '../../../components/customer/customer-ui';
import { useActiveColors } from '../../../hooks/useActiveColors';
import { formatAdministrativeArea, NEW_ADMIN_DISTRICT_VALUE } from '../../../lib/address-options';

export type BookingAddress = {
  id?: number;
  label?: string | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  addressDetail?: string | null;
  isDefault?: boolean;
};

type BookingAddressData = {
  addresses: BookingAddress[];
  selectedAddressId: number | null;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  provinceOptions: string[];
  wardOptions: string[];
};

type BookingAddressActions = {
  onSelectAddress: (address: BookingAddress) => void;
  onOpenProvince: () => void;
  onOpenWard: () => void;
  onDistrictChange: (value: string) => void;
  onAddressDetailChange: (value: string) => void;
};

export function BookingAddressSection({ data, actions }: { data: BookingAddressData; actions: BookingAddressActions }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);

  return (
    <View style={styles.formBlock}>
      <SectionHeader title="Địa chỉ đã lưu" subtitle={data.addresses.length ? 'Chọn nhanh địa chỉ của bạn' : 'Bạn có thể nhập địa chỉ mới bên dưới'} />
      {data.addresses.length ? (
        <View style={styles.addressList}>
          {data.addresses.map((address) => (
            <AddressCard key={String(address.id || `${address.addressDetail}-${address.ward}`)} address={address} selected={data.selectedAddressId === address.id} onPress={() => actions.onSelectAddress(address)} />
          ))}
        </View>
      ) : (
        <InlineMessage tone="neutral" message="Bạn chưa có địa chỉ đã lưu. Hãy nhập địa chỉ mới cho đơn này." />
      )}
      <View style={styles.row}>
        <Button mode="outlined" onPress={actions.onOpenProvince} style={styles.flexButton} icon="map-marker-outline">{data.province || 'Tỉnh/Thành'}</Button>
        <Button mode="outlined" onPress={actions.onOpenWard} disabled={!data.province} style={styles.flexButton} icon="map-marker-radius-outline">{data.ward || 'Phường/Xã'}</Button>
      </View>
      <TextInput label="Quận/Huyện" mode="outlined" value={data.district} onChangeText={actions.onDistrictChange} placeholder={NEW_ADMIN_DISTRICT_VALUE} />
      <TextInput label="Địa chỉ chi tiết" mode="outlined" value={data.addressDetail} onChangeText={actions.onAddressDetailChange} placeholder="Số nhà, tên đường, tòa nhà..." />
      {data.province && data.ward ? <HelperText type="info" visible>{formatAdministrativeArea(data.province, data.ward, data.district)}</HelperText> : null}
    </View>
  );
}

function AddressCard({ address, selected, onPress }: { address: BookingAddress; selected: boolean; onPress: () => void }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Chọn địa chỉ ${address.label || address.addressDetail || ''}`} accessibilityHint="Áp dụng địa chỉ này cho đơn đặt dịch vụ" hitSlop={6}>
      <CustomerCard style={[styles.addressCard, selected && styles.addressCardSelected]}>
        <View style={styles.addressHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={styles.titleText} numberOfLines={1}>{address.label || 'Địa chỉ'}</Text>
            <Text variant="bodySmall" style={styles.subtitle} numberOfLines={2}>{address.addressDetail}, {address.ward}, {address.province}</Text>
          </View>
          <View style={styles.addressBadgeRow}>
            {address.isDefault ? <StatusChip label="Mặc định" color={activeColors.success} /> : null}
            {selected ? <View style={styles.selectedCheck}><MaterialCommunityIcons name="check" size={14} color={activeColors.onPrimary} /></View> : null}
          </View>
        </View>
      </CustomerCard>
    </Pressable>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  formBlock: { gap: 12 },
  addressList: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  flexButton: { flex: 1 },
  addressCard: { borderColor: activeColors.border },
  addressCardSelected: { borderColor: activeColors.primary, borderWidth: 2 },
  addressHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  titleText: { color: activeColors.text, fontWeight: '900' },
  subtitle: { color: activeColors.textSecondary, lineHeight: 20 },
  addressBadgeRow: { alignItems: 'flex-end', gap: 6 },
  selectedCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: activeColors.primary, alignItems: 'center', justifyContent: 'center' },
});
