import { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { Button, Searchbar, Text, TextInput, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import {
  ProviderCard,
  ProviderPageHeader,
  ProviderScreen,
  ProviderEmptyState,
  ProviderInlineMessage,
  ProviderLoadingState,
} from '../../components/provider/provider-ui';
import { useAddressOptions } from '../../hooks/useAddressOptions';
import {
  NEW_ADMIN_DISTRICT_VALUE,
  getProvinceOptions,
  getWardOptions,
} from '../../lib/address-options';
import { getApiErrorMessage, normalizeList } from '../../lib/api-response';
import { profileApi } from '../../features/profile/profile.api';
import { useRouter } from 'expo-router';
import { AddressAutocompleteModal, RegionPickerModal, LocationConfirmationModal } from '../../components/provider/address-pickers';

type AddressItem = {
  id: number;
  label?: string | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  addressDetail?: string | null;
  isDefault?: boolean | null;
  latitude?: number | null;
  longitude?: number | null;
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
};

const emptyForm: AddressForm = {
  label: 'Địa chỉ nhận đơn',
  province: '',
  district: NEW_ADMIN_DISTRICT_VALUE,
  ward: '',
  addressDetail: '',
  latitude: undefined,
  longitude: undefined,
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
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const styles = getStyles(activeColors);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addressOptions, loading: optionsLoading, fallback } = useAddressOptions();
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [regionPickerVisible, setRegionPickerVisible] = useState(false);
  const [autocompleteVisible, setAutocompleteVisible] = useState(false);
  const [mapConfirmVisible, setMapConfirmVisible] = useState(false);
  const [tempLocation, setTempLocation] = useState<{lat: number, lng: number, addressName: string} | null>(null);

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => normalizeList<AddressItem>(await profileApi.getAddresses()),
  });

  const provinceOptions = useMemo(() => getProvinceOptions(addressOptions), [addressOptions]);
  const wardOptions = useMemo(() => getWardOptions(form.province, addressOptions), [addressOptions, form.province]);

  const invalidateAddresses = async () => {
    await queryClient.invalidateQueries({ queryKey: ['addresses'] });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: AddressForm) => {
      let lat = payload.latitude;
      let lng = payload.longitude;
      if (!lat || !lng) {
        try {
          const results = await Location.geocodeAsync(`${payload.addressDetail}, ${payload.ward}, ${payload.province}, Việt Nam`);
          if (results && results.length > 0) {
            lat = results[0].latitude;
            lng = results[0].longitude;
          }
        } catch {}
      }
      return profileApi.createAddress({ ...toPayload(payload), latitude: lat || 21.028511, longitude: lng || 105.804817 });
    },
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
    mutationFn: async (payload: AddressForm) => {
      let lat = payload.latitude;
      let lng = payload.longitude;
      if (!lat || !lng) {
        try {
          const results = await Location.geocodeAsync(`${payload.addressDetail}, ${payload.ward}, ${payload.province}, Việt Nam`);
          if (results && results.length > 0) {
            lat = results[0].latitude;
            lng = results[0].longitude;
          }
        } catch {}
      }
      return profileApi.updateAddress(payload.id!, { ...toPayload(payload), latitude: lat || 21.028511, longitude: lng || 105.804817 });
    },
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
    mutationFn: (id: number) => profileApi.deleteAddress(id),
    onSuccess: async () => {
      await invalidateAddresses();
      setMessageTone('success');
      setMessage('Đã xóa địa chỉ thành công.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    },
    onError: (err) => showError(err, 'Không thể xóa địa chỉ.'),
  });

  const defaultMutation = useMutation({
    mutationFn: (id: number) => profileApi.setDefaultAddress(id),
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
    setShowForm(false);
  }

  function updateForm(patch: Partial<AddressForm>) {
    setForm((current) => ({ ...current, ...patch }));
    setMessage('');
  }



  function startEdit(address: AddressItem) {
    setForm({
      id: address.id,
      label: address.label || 'Địa chỉ nhận đơn',
      province: address.province || '',
      district: address.district || NEW_ADMIN_DISTRICT_VALUE,
      ward: address.ward || '',
      addressDetail: address.addressDetail || '',
      latitude: address.latitude || undefined,
      longitude: address.longitude || undefined,
    });
    setShowForm(true);
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

  return (
    <ProviderScreen scroll>
      <ProviderPageHeader 
        title="Địa chỉ hoạt động" 
        subtitle="Quản lý địa chỉ để khách hàng có thể xem." 
        onBack={() => router.back()}
      />
      
      {message ? <ProviderInlineMessage tone={messageTone} message={message} /> : null}
      {optionsLoading ? <ProviderInlineMessage tone="info" message="Đang tải danh sách tỉnh/phường..." /> : null}
      {fallback ? <ProviderInlineMessage tone="warning" message="Đang dùng danh sách địa chỉ dự phòng." /> : null}

      {addressesQuery.isLoading ? <ProviderLoadingState label="Đang tải địa chỉ..." /> : null}
      {addressesQuery.isError ? (
        <ProviderInlineMessage tone="error" message="Không thể tải danh sách địa chỉ. Kéo xuống hoặc bấm thử lại." />
      ) : null}
      {!addressesQuery.isLoading && addresses.length === 0 ? (
        <ProviderEmptyState
          icon="map-marker-plus-outline"
          title="Chưa có địa chỉ"
          description="Thêm địa chỉ để tăng độ tin cậy với khách hàng."
        />
      ) : null}

      {addresses.map((item: AddressItem) => (
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

      {!showForm ? (
        <Button
          mode="outlined"
          icon="plus"
          onPress={() => setShowForm(true)}
          style={{ marginTop: 12, borderColor: activeColors.primary, borderRadius: 12 }}
          textColor={activeColors.primary}
        >
          Thêm địa chỉ mới
        </Button>
      ) : (
      <ProviderCard>
        <View style={styles.form}>
          <View style={styles.formHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={styles.title}>
                {form.id ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
              </Text>
              <Text variant="bodySmall" style={styles.muted}>
                Nhập chính xác để khách hàng có thể tìm đến bạn.
              </Text>
            </View>
            <Button mode="text" onPress={resetForm} textColor={activeColors.error}>
              {form.id ? 'Hủy sửa' : 'Đóng'}
            </Button>
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
                style={StyleSheet.absoluteFillObject}
                initialRegion={{
                  latitude: form.latitude,
                  longitude: form.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                pitchEnabled={false}
                rotateEnabled={false}
                scrollEnabled={false}
                zoomEnabled={false}
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
                <View style={styles.miniMapHint}>
                  <Text style={styles.miniMapHintText}>Chạm để chọn lại trên bản đồ</Text>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={activeColors.primary} />
                </View>
              </View>
            </View>
          ) : null}
          <Button mode="contained" loading={saving} disabled={saving} onPress={submit} style={styles.button}>
            {form.id ? 'Lưu địa chỉ' : 'Thêm địa chỉ'}
          </Button>
        </View>
      </ProviderCard>
      )}

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
        searchSuffix={form.province && form.ward ? `${form.ward}, ${form.province}` : undefined}
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
    </ProviderScreen>
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
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const styles = getStyles(activeColors);
  const icon = getAddressIcon(address.label);
  const color = getAddressColor(address.label, activeColors);

  return (
    <ProviderCard>
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
                    <Text style={styles.defaultBadgeText}>Mặc định (Khách sẽ thấy)</Text>
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
    </ProviderCard>
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
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
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

function OptionPicker({
  visible,
  title,
  options,
  value,
  onDismiss,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: string[];
  value: string;
  onDismiss: () => void;
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const styles = getStyles(activeColors);
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={styles.sheet}>
        <View style={styles.dragIndicator} />
        <View style={styles.sheetHeader}>
          <Text variant="titleLarge" style={styles.title}>
            {title}
          </Text>
          <Button mode="text" onPress={onDismiss} textColor={activeColors.textSecondary}>
            Đóng
          </Button>
        </View>
        <Searchbar placeholder="Tìm kiếm" value={query} onChangeText={setQuery} style={styles.search} />
        {filtered.length === 0 ? (
          <ProviderEmptyState title="Không có kết quả" description="Thử nhập từ khóa khác." />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.optionRow,
                  item === value && styles.optionRowActive,
                ]}
                onPress={() => onSelect(item)}
                accessibilityRole="button"
                accessibilityLabel={`Chọn ${item}`}
                hitSlop={4}
              >
                <Text style={[styles.optionText, item === value && styles.optionSelected]}>{item}</Text>
                {item === value ? <MaterialCommunityIcons name="check" size={20} color={activeColors.primary} /> : null}
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  title: { color: activeColors.text, fontWeight: '900' },
  muted: { color: activeColors.textSecondary, lineHeight: 18 },
  form: { gap: 16 },
  formHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  button: { borderRadius: 16, height: 48, justifyContent: 'center' },
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
  miniMapContainer: { height: 120, borderRadius: 12, overflow: 'hidden', marginTop: 4, position: 'relative', borderWidth: 1, borderColor: activeColors.borderLight },
  miniMapOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-end', padding: 8 },
  miniMapHint: { backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  miniMapHintText: { fontSize: 12, color: activeColors.primary, fontWeight: '500', marginRight: 2 },
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
    borderRadius: 12,
    borderWidth: 1,
    borderColor: activeColors.border,
    backgroundColor: activeColors.surface,
  },
  segmentedButtonActive: { backgroundColor: activeColors.primary, borderColor: activeColors.primary },
  segmentedButtonText: { fontSize: 13, color: activeColors.textSecondary, fontWeight: '700' },
  segmentedButtonTextActive: { color: '#FFFFFF' },
  outlineStyle: { borderRadius: 14 },
  textInput: { backgroundColor: activeColors.surface },
});
