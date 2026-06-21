import { useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
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

type AddressItem = {
  id: number;
  label?: string | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  addressDetail?: string | null;
  isDefault?: boolean | null;
};

type AddressForm = {
  id?: number;
  label: string;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
};

const emptyForm: AddressForm = {
  label: '',
  province: '',
  district: NEW_ADMIN_DISTRICT_VALUE,
  ward: '',
  addressDetail: '',
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
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info' | 'warning'>('info');
  const [picker, setPicker] = useState<null | 'province' | 'ward'>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

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
    mutationFn: (payload: AddressForm) => profileApi.createAddress(toPayload(payload)),
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
    mutationFn: (payload: AddressForm) => profileApi.updateAddress(payload.id!, toPayload(payload)),
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
  }

  function updateForm(patch: Partial<AddressForm>) {
    setForm((current) => ({ ...current, ...patch }));
    setMessage('');
  }

  const handleGetLocation = async () => {
    try {
      setGettingLocation(true);
      setMessage('');
      
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError(null, 'Cần quyền truy cập vị trí để tự động điền.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const detailParts = [address.streetNumber, address.street].filter(Boolean).join(' ');
        
        // Attempt to loosely match province and ward
        const regionStr = (address.region || address.city || address.subregion || '').toLowerCase().replace('tỉnh', '').replace('thành phố', '').trim();
        const districtStr = (address.subregion || address.district || address.city || '').toLowerCase().replace('quận', '').replace('huyện', '').replace('thị xã', '').replace('phường', '').replace('xã', '').trim();

        let matchedProvince = addressOptions.find(p => p.name.toLowerCase().includes(regionStr));
        // Fallback to district string for province if region is null
        if (!matchedProvince && districtStr) {
           matchedProvince = addressOptions.find(p => p.name.toLowerCase().includes(districtStr));
        }
        
        let matchedWard = '';
        if (matchedProvince) {
          const wardStr = (address.district || address.street || '').toLowerCase().replace('phường', '').replace('xã', '').trim();
          matchedWard = matchedProvince.wards.find(w => w.toLowerCase().includes(wardStr)) || '';
        }

        updateForm({
          addressDetail: detailParts || address.name || '',
          province: matchedProvince?.name || form.province,
          ward: matchedWard || form.ward,
        });
        
        setMessageTone('success');
        setMessage('Đã điền tự động từ vị trí hiện tại. Vui lòng kiểm tra lại.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch (err) {
      showError(err, 'Không thể lấy vị trí hiện tại. Vui lòng kiểm tra GPS.');
    } finally {
      setGettingLocation(false);
    }
  };

  function startEdit(address: AddressItem) {
    setForm({
      id: address.id,
      label: address.label || '',
      province: address.province || '',
      district: address.district || NEW_ADMIN_DISTRICT_VALUE,
      ward: address.ward || '',
      addressDetail: address.addressDetail || '',
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
    <ProviderScreen>
      <ProviderPageHeader 
        title="Địa chỉ hoạt động" 
        subtitle="Quản lý địa chỉ để khách hàng có thể xem." 
        action={
          <Button mode="text" onPress={() => router.back()} textColor={activeColors.primary}>
            Đóng
          </Button>
        }
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
                  Văn phòng / Công ty
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
                placeholder="Ví dụ: Cửa hàng 1, Chi nhánh..."
                outlineStyle={styles.outlineStyle}
                style={styles.textInput}
              />
            ) : null}
          </View>

          <PickerField label="Tỉnh/Thành" value={form.province} onPress={() => setPicker('province')} />
          <PickerField
            label="Phường/Xã"
            value={form.ward}
            disabled={!form.province}
            onPress={() => setPicker('ward')}
          />
          <TextInput
            label="Địa chỉ chi tiết"
            mode="outlined"
            value={form.addressDetail}
            onChangeText={(addressDetail) => updateForm({ addressDetail })}
            outlineStyle={styles.outlineStyle}
            style={styles.textInput}
            multiline
          />
          <Button 
            mode="outlined" 
            icon="crosshairs-gps" 
            loading={gettingLocation} 
            disabled={gettingLocation} 
            onPress={handleGetLocation} 
            style={[styles.button, { borderColor: activeColors.primary }]}
            textColor={activeColors.primary}
          >
            Lấy vị trí hiện tại
          </Button>
          <Button mode="contained" loading={saving} disabled={saving} onPress={submit} style={styles.button}>
            {form.id ? 'Lưu địa chỉ' : 'Thêm địa chỉ'}
          </Button>
        </View>
      </ProviderCard>

      <OptionPicker
        visible={picker === 'province'}
        title="Chọn tỉnh/thành"
        options={provinceOptions}
        value={form.province}
        onDismiss={() => setPicker(null)}
        onSelect={(province) => {
          updateForm({ province, ward: '', district: NEW_ADMIN_DISTRICT_VALUE });
          setPicker(null);
          Haptics.selectionAsync().catch(() => {});
        }}
      />
      <OptionPicker
        visible={picker === 'ward'}
        title="Chọn phường/xã"
        options={wardOptions}
        value={form.ward}
        onDismiss={() => setPicker(null)}
        onSelect={(ward) => {
          updateForm({ ward, district: NEW_ADMIN_DISTRICT_VALUE });
          setPicker(null);
          Haptics.selectionAsync().catch(() => {});
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
