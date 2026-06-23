import { useActiveColors } from '../../hooks/useActiveColors';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Button, Searchbar, Text, TextInput, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  CustomerCard,
  CustomerHeader,
  CustomerScreen,
  EmptyState,
  InlineMessage,
  LoadingState,
} from '../../components/customer/customer-ui';
import { Colors } from '../../constants/colors';

import { useAddressOptions } from '../../hooks/useAddressOptions';
import {
  NEW_ADMIN_DISTRICT_VALUE,
  getProvinceOptions,
  getWardOptions,
} from '../../lib/address-options';
import { getApiErrorMessage, normalizeList } from '../../lib/api-response';
import { userApi } from '../../features/user/user.api';
import { AddressAutocompleteModal, RegionPickerModal, LocationConfirmationModal } from '../../components/customer/address-pickers';
import MapView, { Marker } from 'react-native-maps';

type AddressItem = {
  id: number;
  label?: string | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  addressDetail?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean | null;
};

type AddressForm = {
  id?: number;
  label: string;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
};

const emptyForm: AddressForm = {
  label: '',
  province: '',
  district: NEW_ADMIN_DISTRICT_VALUE,
  ward: '',
  addressDetail: '',
  latitude: undefined,
  longitude: undefined,
  isDefault: false,
};

function formatFullAddress(address: AddressItem | AddressForm) {
  return [address.addressDetail, address.ward, address.district !== NEW_ADMIN_DISTRICT_VALUE ? address.district : '', address.province]
    .filter(Boolean)
    .join(', ');
}

function validateAddressForm(form: AddressForm) {
  if (!form.province) return 'Vui lòng chọn tỉnh/thành.';
  if (!form.ward) return 'Vui lòng chọn phường/xã.';
  if (!form.addressDetail.trim()) return 'Vui lòng nhập địa chỉ chi tiết.';
  return '';
}

function getAddressIcon(label?: string | null): string {
  const text = String(label || '').toLowerCase();
  if (text.includes('nhà') || text.includes('home')) return 'home-outline';
  if (text.includes('cơ quan') || text.includes('công ty') || text.includes('văn phòng') || text.includes('office') || text.includes('work')) {
    return 'briefcase-outline';
  }
  return 'map-marker-outline';
}

function getAddressColor(label?: string | null, activeColors?: any): string {
  const text = String(label || '').toLowerCase();
  if (text.includes('nhà') || text.includes('home')) return activeColors.primary;
  if (text.includes('cơ quan') || text.includes('công ty') || text.includes('văn phòng') || text.includes('office') || text.includes('work')) {
    return '#7C3AED';
  }
  return activeColors.secondary;
}

export default function AddressesScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const queryClient = useQueryClient();
  const { addressOptions, loading: optionsLoading, fallback } = useAddressOptions();
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info'>('info');
  const [regionPickerVisible, setRegionPickerVisible] = useState(false);
  const [autocompleteVisible, setAutocompleteVisible] = useState(false);
  const [mapConfirmVisible, setMapConfirmVisible] = useState(false);
  const [tempLocation, setTempLocation] = useState<{lat: number, lng: number, addressName: string} | null>(null);

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => normalizeList<AddressItem>(await userApi.getAddresses()),
  });

  const provinceOptions = useMemo(() => getProvinceOptions(addressOptions), [addressOptions]);
  const wardOptions = useMemo(() => getWardOptions(form.province, addressOptions), [addressOptions, form.province]);

  const invalidateAddresses = async () => {
    await queryClient.invalidateQueries({ queryKey: ['addresses'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: AddressForm) => userApi.createAddress(toPayload(payload)),
    onSuccess: async () => {
      await invalidateAddresses();
      resetForm();
      setMessageTone('success');
      setMessage('Đã thêm địa chỉ thành công.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    onError: (err) => showError(err, 'Không thể tạo địa chỉ.'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: AddressForm) => userApi.updateAddress(payload.id!, toPayload(payload)),
    onSuccess: async () => {
      await invalidateAddresses();
      resetForm();
      setMessageTone('success');
      setMessage('Đã cập nhật địa chỉ thành công.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    onError: (err) => showError(err, 'Không thể cập nhật địa chỉ.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => userApi.deleteAddress(id),
    onSuccess: async () => {
      await invalidateAddresses();
      setMessageTone('success');
      setMessage('Đã xóa địa chỉ thành công.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    onError: (err) => showError(err, 'Không thể xóa địa chỉ.'),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: number) => userApi.setDefaultAddress(id),
    onSuccess: async () => {
      await invalidateAddresses();
      setMessageTone('success');
      setMessage('Đã đặt địa chỉ mặc định.');
      Haptics.selectionAsync().catch(() => {});
    },
    onError: (err) => showError(err, 'Không thể đặt mặc định.'),
  });

  function showError(err: unknown, fallback: string) {
    setMessageTone('error');
    setMessage(getApiErrorMessage(err, fallback));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  }

  function resetForm() {
    setForm(emptyForm);
  }

  function updateForm(patch: Partial<AddressForm>) {
    setForm((current) => ({ ...current, ...patch }));
    setMessage('');
  }

  function startEdit(address: AddressItem) {
    setForm({
      id: address.id,
      label: address.label || '',
      province: address.province || '',
      district: address.district || NEW_ADMIN_DISTRICT_VALUE,
      ward: address.ward || '',
      addressDetail: address.addressDetail || '',
      latitude: address.latitude || undefined,
      longitude: address.longitude || undefined,
      isDefault: address.isDefault || false,
    });
    Haptics.selectionAsync().catch(() => {});
  }

  function submit() {
    const error = validateAddressForm(form);
    if (error) {
      setMessageTone('error');
      setMessage(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    if (form.id) {
      updateMutation.mutate(form);
    } else {
      createMutation.mutate(form);
    }
  }

  function confirmDelete(address: AddressItem) {
    Alert.alert('Xóa địa chỉ', `Bạn có chắc muốn xóa "${address.label || 'Địa chỉ'}"?`, [
      { text: 'Đóng', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(address.id),
      },
    ]);
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const addresses = addressesQuery.data || [];
  const isCustomLabel = form.label !== 'Nhà riêng' && form.label !== 'Văn phòng';

  return (
    <CustomerScreen>
      <CustomerHeader title="Địa chỉ của tôi" subtitle="Quản lý địa chỉ dùng khi đặt dịch vụ" />
      {message ? <InlineMessage tone={messageTone} message={message} /> : null}
      {optionsLoading ? <InlineMessage message="Đang tải danh sách tỉnh/phường..." /> : null}
      {fallback ? <InlineMessage tone="warning" message="Đang dùng danh sách địa chỉ dự phòng." /> : null}

      {addressesQuery.isLoading ? <LoadingState label="Đang tải địa chỉ..." /> : null}
      {addressesQuery.isError ? (
        <InlineMessage tone="error" message="Không thể tải danh sách địa chỉ. Kéo xuống hoặc bấm thử lại." />
      ) : null}
      {!addressesQuery.isLoading && addresses.length === 0 ? (
        <EmptyState
          icon="map-marker-plus-outline"
          title="Chưa có địa chỉ"
          description="Thêm địa chỉ đầu tiên để đặt dịch vụ nhanh hơn."
        />
      ) : null}

      {addresses.map((item) => (
        <AddressCard
          key={String(item.id)}
          address={item}
          defaultLoading={defaultMutation.isPending}
          deleteLoading={deleteMutation.isPending}
          onEdit={() => startEdit(item)}
          onSetDefault={() => defaultMutation.mutate(item.id)}
          onDelete={() => confirmDelete(item)}
        />
      ))}

      <CustomerCard>
        <View style={styles.form}>
          <View style={styles.formHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={styles.title}>
                {form.id ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
              </Text>
              <Text variant="bodySmall" style={styles.muted}>
                Tỉnh/thành và phường/xã dùng theo địa giới mới.
              </Text>
            </View>
            {form.id ? (
              <Button mode="text" onPress={resetForm} textColor={activeColors.error}>
                Hủy sửa
              </Button>
            ) : null}
          </View>

          <View style={styles.labelSelectionGroup}>
            <Text variant="labelMedium" style={styles.labelSelectionTitle}>
              Nhãn địa chỉ
            </Text>
            <View style={styles.segmentedButtonsContainer}>
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  updateForm({ label: 'Nhà riêng' });
                }}
                style={[
                  styles.segmentedButton,
                  form.label === 'Nhà riêng' && styles.segmentedButtonActive,
                ]}
              >
                <MaterialCommunityIcons
                  name="home-outline"
                  size={16}
                  color={form.label === 'Nhà riêng' ? '#FFFFFF' : activeColors.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentedButtonText,
                    form.label === 'Nhà riêng' && styles.segmentedButtonTextActive,
                  ]}
                >
                  Nhà riêng
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  updateForm({ label: 'Văn phòng' });
                }}
                style={[
                  styles.segmentedButton,
                  form.label === 'Văn phòng' && styles.segmentedButtonActive,
                ]}
              >
                <MaterialCommunityIcons
                  name="briefcase-outline"
                  size={16}
                  color={form.label === 'Văn phòng' ? '#FFFFFF' : activeColors.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentedButtonText,
                    form.label === 'Văn phòng' && styles.segmentedButtonTextActive,
                  ]}
                >
                  Văn phòng
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  if (form.label === 'Nhà riêng' || form.label === 'Văn phòng') {
                    updateForm({ label: '' });
                  }
                }}
                style={[styles.segmentedButton, isCustomLabel && styles.segmentedButtonActive]}
              >
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={16}
                  color={isCustomLabel ? '#FFFFFF' : activeColors.textSecondary}
                />
                <Text
                  style={[
                    styles.segmentedButtonText,
                    isCustomLabel && styles.segmentedButtonTextActive,
                  ]}
                >
                  Khác
                </Text>
              </Pressable>
            </View>

            {isCustomLabel ? (
              <TextInput
                label="Tên nhãn tùy chỉnh"
                mode="outlined"
                value={form.label}
                onChangeText={(label) => updateForm({ label })}
                placeholder="Ví dụ: Nhà bạn gái, Chung cư..."
                outlineStyle={styles.outlineStyle}
                style={styles.textInput}
              />
            ) : null}
          </View>

          <PickerField 
            label="Tỉnh/Thành Phố và Phường/Xã" 
            value={form.province && form.ward ? `${form.province} - ${form.ward}` : form.province || ''} 
            onPress={() => setRegionPickerVisible(true)} 
          />
          <PickerField
            label="Tên đường, Toà nhà, Số nhà."
            value={form.addressDetail}
            onPress={() => setAutocompleteVisible(true)}
          />

          {form.latitude && form.longitude ? (
            <View style={styles.miniMapContainer}>
              <MapView
                style={styles.miniMap}
                initialRegion={{
                  latitude: form.latitude,
                  longitude: form.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                region={{
                  latitude: form.latitude,
                  longitude: form.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
                onPress={() => {
                  setTempLocation({
                    lat: form.latitude!,
                    lng: form.longitude!,
                    addressName: form.addressDetail,
                  });
                  setMapConfirmVisible(true);
                }}
              >
                <Marker coordinate={{ latitude: form.latitude, longitude: form.longitude }} />
              </MapView>
              <View style={styles.miniMapOverlay} pointerEvents="none">
                <Text style={styles.miniMapText} numberOfLines={1}>{form.addressDetail}</Text>
              </View>
            </View>
          ) : null}

          {!form.id && (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Đặt làm địa chỉ mặc định</Text>
              <Switch
                value={form.isDefault || false}
                onValueChange={(val) => updateForm({ isDefault: val })}
                color="#EA580C"
              />
            </View>
          )}

          <Button mode="contained" loading={saving} disabled={saving} onPress={submit} style={styles.submitButton} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
            {form.id ? 'Lưu địa chỉ' : 'Hoàn Thành'}
          </Button>

          {form.id ? (
            <Button mode="outlined" onPress={() => confirmDelete(form as any)} style={styles.deleteButton} textColor={activeColors.error}>
              Xóa địa chỉ
            </Button>
          ) : null}
        </View>
      </CustomerCard>

      <RegionPickerModal
        visible={regionPickerVisible}
        provinceOptions={provinceOptions}
        getWardOptions={(prov) => getWardOptions(prov, addressOptions)}
        onDismiss={() => setRegionPickerVisible(false)}
        onSelectCurrentLocation={(data) => {
          updateForm({
            province: data.province,
            ward: data.ward,
            addressDetail: data.addressDetail,
            latitude: data.lat,
            longitude: data.lng,
          });
          setRegionPickerVisible(false);
        }}
        onSelectRegion={(province, ward) => {
          updateForm({ province, ward, district: NEW_ADMIN_DISTRICT_VALUE });
          setRegionPickerVisible(false);
        }}
      />
      
      <AddressAutocompleteModal
        visible={autocompleteVisible}
        onDismiss={() => setAutocompleteVisible(false)}
        onSelect={(place) => {
          setAutocompleteVisible(false);
          setTempLocation({
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
            addressName: [place.address?.house_number, place.address?.road].filter(Boolean).join(', ') || place.display_name.split(',')[0],
          });
          setMapConfirmVisible(true);
        }}
      />

      <LocationConfirmationModal
        visible={mapConfirmVisible}
        initialLocation={tempLocation}
        onDismiss={() => setMapConfirmVisible(false)}
        onConfirm={(lat, lng, addressName) => {
          updateForm({
            addressDetail: addressName,
            latitude: lat,
            longitude: lng,
          });
          setMapConfirmVisible(false);
        }}
      />
    </CustomerScreen>
  );
}

function toPayload(form: AddressForm) {
  return {
    label: form.label.trim(),
    province: form.province,
    district: NEW_ADMIN_DISTRICT_VALUE,
    ward: form.ward,
    addressDetail: form.addressDetail.trim(),
    latitude: form.latitude,
    longitude: form.longitude,
    isDefault: form.isDefault,
  };
}

function AddressCard({
  address,
  defaultLoading,
  deleteLoading,
  onEdit,
  onSetDefault,
  onDelete,
}: {
  address: AddressItem;
  defaultLoading: boolean;
  deleteLoading: boolean;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const icon = getAddressIcon(address.label);
  const color = getAddressColor(address.label, activeColors);

  return (
    <CustomerCard>
      <View style={styles.addressCardRow}>
        <View style={[styles.addressIconCircle, { backgroundColor: `${color}12` }]}>
          <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        </View>
        <View style={styles.addressContentBody}>
          <View style={styles.addressHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.rowAlign}>
                <Text variant="titleSmall" style={styles.addressLabelText}>
                  {address.label || 'Địa chỉ'}
                </Text>
                {address.isDefault ? (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>Mặc định</Text>
                  </View>
                ) : null}
              </View>
              <Text variant="bodySmall" style={styles.addressDetailsText} numberOfLines={2}>
                {formatFullAddress(address)}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            <Button
              compact
              mode="outlined"
              icon="pencil-outline"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onEdit();
              }}
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
            >
              Sửa
            </Button>
            {!address.isDefault ? (
              <Button
                compact
                mode="outlined"
                loading={defaultLoading}
                disabled={defaultLoading}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                  onSetDefault();
                }}
                style={styles.actionButton}
                labelStyle={styles.actionButtonLabel}
              >
                Đặt mặc định
              </Button>
            ) : null}
            <Button
              compact
              mode="text"
              icon="delete-outline"
              loading={deleteLoading}
              disabled={deleteLoading}
              textColor={activeColors.error}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                onDelete();
              }}
              labelStyle={styles.actionButtonLabel}
            >
              Xóa
            </Button>
          </View>
        </View>
      </View>
    </CustomerCard>
  );
}

function PickerField({
  label,
  value,
  disabled,
  onPress,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}${value ? `: ${value}` : ''}`}
      accessibilityHint="Mở danh sách lựa chọn"
      hitSlop={6}
    >
      <TextInput
        label={label}
        mode="outlined"
        value={value}
        editable={false}
        disabled={disabled}
        outlineStyle={styles.outlineStyle}
        style={styles.textInput}
        right={<TextInput.Icon icon="chevron-down" />}
      />
    </Pressable>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  title: { color: activeColors.text, fontWeight: '900' },
  muted: { color: activeColors.textSecondary, lineHeight: 18 },
  form: { gap: 16 },
  formHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '78%',
    backgroundColor: activeColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    gap: 12,
  },
  dragIndicator: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: activeColors.borderStrong,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  search: { backgroundColor: activeColors.surfaceVariant, borderRadius: 14 },
  optionRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: activeColors.border,
    paddingHorizontal: 6,
    gap: 12,
  },
  optionRowActive: {
    backgroundColor: activeColors.primarySoft,
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  optionText: { flex: 1, color: activeColors.text, fontWeight: '700' },
  optionSelected: { color: activeColors.primary },
  addressCardRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  addressIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressContentBody: { flex: 1, gap: 10 },
  addressLabelText: { color: activeColors.text, fontWeight: '900' },
  addressDetailsText: { color: activeColors.textSecondary, lineHeight: 18, marginTop: 2 },
  rowAlign: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  defaultBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  defaultBadgeText: { color: '#15803D', fontSize: 11, fontWeight: '800' },
  addressHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { borderRadius: 10, borderColor: activeColors.border },
  actionButtonLabel: { fontSize: 12, fontWeight: '700' },
  labelSelectionGroup: { gap: 8 },
  labelSelectionTitle: { color: activeColors.text, fontWeight: '800', marginLeft: 4 },
  segmentedButtonsContainer: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  segmentedButton: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: activeColors.border,
    backgroundColor: '#FFFFFF',
  },
  segmentedButtonActive: { backgroundColor: activeColors.primary, borderColor: activeColors.primary },
  segmentedButtonText: { fontSize: 13, color: activeColors.textSecondary, fontWeight: '700' },
  segmentedButtonTextActive: { color: '#FFFFFF' },
  outlineStyle: { borderRadius: 14 },
  textInput: { backgroundColor: '#FFFFFF' },
  miniMapContainer: {
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    marginTop: -8,
  },
  miniMap: {
    ...StyleSheet.absoluteFillObject,
  },
  miniMapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  miniMapText: {
    fontSize: 12,
    color: activeColors.text,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: activeColors.text,
  },
  submitButton: {
    borderRadius: 12,
    backgroundColor: '#EA580C',
    height: 48,
    justifyContent: 'center',
    marginTop: 8,
  },
  deleteButton: {
    borderRadius: 12,
    borderColor: activeColors.error,
    borderWidth: 1,
    height: 48,
    justifyContent: 'center',
  },
});
