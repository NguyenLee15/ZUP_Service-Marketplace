import { useActiveColors } from '../../hooks/useActiveColors';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Linking } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Chip, HelperText, Text, TextInput } from 'react-native-paper';
import {
  CustomerCard,
  CustomerScreen,
  EmptyState,
  InlineMessage,
  LoadingState,
  SectionHeader,
  StatusChip,
} from '../../components/customer/customer-ui';
import { Colors } from '../../constants/colors';
import { bookingApi } from '../../features/booking/booking.api';
import { serviceApi } from '../../features/service/service.api';
import { userApi } from '../../features/user/user.api';
import { getApiErrorMessage, normalizeList, unwrapData } from '../../lib/api-response';
import {
  NEW_ADMIN_DISTRICT_VALUE,
  formatAdministrativeArea,
  getProvinceOptions,
  getWardOptions,
} from '../../lib/address-options';
import { formatCurrency, formatDateTime } from '../../lib/format';
import { useAddressOptions } from '../../hooks/useAddressOptions';
import { routes } from '../../lib/route-utils';

type BookingAddress = {
  id?: number;
  label?: string | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  addressDetail?: string | null;
  isDefault?: boolean;
};

type BookingService = {
  id?: number | string;
  name?: string;
  referencePrice?: number | string | null;
  provider?: { fullName?: string | null } | null;
  category?: { name?: string | null } | null;
};

type CreateBookingForm = {
  selectedChips: string[];
  customText: string;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  desiredTime: Date | null;
  timeMode: 'now' | 'scheduled';
};

const COMMON_ISSUES: Record<string, Array<{ q: string; options: string[] }>> = {
  'điều hòa': [
    { q: 'Tình trạng hiện tại?', options: ['Không lạnh', 'Chảy nước', 'Kêu to', 'Mất nguồn', 'Báo lỗi'] },
    { q: 'Loại máy?', options: ['Treo tường', 'Âm trần', 'Tủ đứng', 'Inverter', 'Máy cơ'] },
  ],
  'máy giặt': [
    { q: 'Máy đang gặp sự cố gì?', options: ['Không vắt', 'Không cấp nước', 'Rung lắc mạnh', 'Mất nguồn', 'Rò rỉ nước'] },
    { q: 'Kiểu máy?', options: ['Cửa trước', 'Cửa trên'] },
  ],
  'dọn dẹp': [
    { q: 'Loại hình dọn dẹp?', options: ['Định kỳ', 'Sau xây dựng', 'Nhà mới chuyển', 'Sofa/đệm'] },
    { q: 'Diện tích?', options: ['Dưới 50m2', '50 - 100m2', 'Trên 100m2'] },
  ],
  default: [{ q: 'Bạn đang cần gì?', options: ['Sửa gấp', 'Bảo trì định kỳ', 'Lắp đặt mới', 'Cần tư vấn'] }],
};

function getDefaultDesiredTime() {
  const next = new Date(Date.now() + 2 * 60 * 60 * 1000);
  next.setSeconds(0, 0);
  return next;
}

function buildDescription(form: CreateBookingForm) {
  return [
    form.selectedChips.length ? `[Tình trạng]: ${form.selectedChips.join(' - ')}` : '',
    form.customText.trim() ? `[Ghi chú thêm]: ${form.customText.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function validateBookingForm(form: CreateBookingForm, serviceId: number) {
  if (!Number.isFinite(serviceId) || serviceId <= 0) return 'Dịch vụ không hợp lệ.';
  if (!buildDescription(form)) return 'Vui lòng mô tả nhu cầu của bạn.';
  if (!form.province || !form.ward || !form.addressDetail.trim()) {
    return 'Vui lòng nhập đầy đủ tỉnh/thành, phường/xã và địa chỉ chi tiết.';
  }
  if (form.timeMode === 'scheduled') {
    if (!form.desiredTime) return 'Vui lòng chọn thời gian mong muốn.';
    if (form.desiredTime.getTime() <= Date.now()) return 'Thời gian phải ở tương lai.';
  }
  return '';
}

function mergeDatePart(current: Date | null, date: Date) {
  const next = current ? new Date(current) : getDefaultDesiredTime();
  next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
  return next;
}

function mergeTimePart(current: Date | null, time: Date) {
  const next = current ? new Date(current) : getDefaultDesiredTime();
  next.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return next;
}

function normalizeServiceId(value?: string) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : 0;
}

export default function CreateBookingScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const { serviceId: rawServiceId, reorderId } = useLocalSearchParams<{ serviceId: string; reorderId?: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const serviceId = normalizeServiceId(rawServiceId);
  const oldBookingId = normalizeServiceId(reorderId);
  const hasAppliedDefaultAddress = useRef(false);
  const hasAppliedReorder = useRef(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [form, setForm] = useState<CreateBookingForm>({
    selectedChips: [],
    customText: '',
    province: '',
    district: NEW_ADMIN_DISTRICT_VALUE,
    ward: '',
    addressDetail: '',
    desiredTime: null,
    timeMode: 'now',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [provincePickerOpen, setProvincePickerOpen] = useState(false);
  const [wardPickerOpen, setWardPickerOpen] = useState(false);
  const [error, setError] = useState('');
  const [conditionPhotos, setConditionPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const { addressOptions, loading: addressOptionsLoading, fallback } = useAddressOptions();

  const serviceQuery = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => unwrapData<BookingService>(await serviceApi.getById(serviceId)),
    enabled: serviceId > 0,
  });

  const addressesQuery = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => normalizeList<BookingAddress>(await userApi.getAddresses()),
  });

  const oldBookingQuery = useQuery({
    queryKey: ['booking', oldBookingId],
    queryFn: async () => unwrapData<any>(await bookingApi.getById(oldBookingId)),
    enabled: oldBookingId > 0,
  });

  const service = serviceQuery.data;
  const addresses = addressesQuery.data || [];
  const provinceOptions = getProvinceOptions(addressOptions);
  const wardOptions = getWardOptions(form.province, addressOptions);
  const questionnaire = useMemo(() => {
    const serviceName = String(service?.name || '').toLowerCase();
    return Object.entries(COMMON_ISSUES).find(([key]) => key !== 'default' && serviceName.includes(key))?.[1] || COMMON_ISSUES.default;
  }, [service?.name]);

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => bookingApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace(routes.tabs.bookings);
    },
    onError: (err) => {
      setError(getApiErrorMessage(err, 'Không thể tạo đơn hàng.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
  });

  const updateForm = (patch: Partial<CreateBookingForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setError('');
  };

  const applyAddress = (address: BookingAddress) => {
    setSelectedAddressId(address.id || null);
    updateForm({
      province: address.province || '',
      district: address.district || NEW_ADMIN_DISTRICT_VALUE,
      ward: address.ward || '',
      addressDetail: address.addressDetail || '',
    });
    Haptics.selectionAsync().catch(() => {});
  };

  useEffect(() => {
    if (oldBookingQuery.data && !hasAppliedReorder.current) {
      hasAppliedReorder.current = true;
      const old = oldBookingQuery.data;
      setSelectedAddressId(null);
      setForm((current) => ({
        ...current,
        customText: old.description || '',
        province: old.province || '',
        district: old.district || NEW_ADMIN_DISTRICT_VALUE,
        ward: old.ward || '',
        addressDetail: old.addressDetail || '',
        desiredTime:
          old.desiredTime && new Date(old.desiredTime).getTime() > Date.now()
            ? new Date(old.desiredTime)
            : null,
        timeMode: old.desiredTime ? 'scheduled' : 'now',
      }));
      return;
    }

    if (hasAppliedReorder.current || hasAppliedDefaultAddress.current) return;
    const defaultAddress = addresses.find((item) => item.isDefault);
    if (defaultAddress) {
      hasAppliedDefaultAddress.current = true;
      applyAddress(defaultAddress);
    }
  }, [addresses, oldBookingQuery.data]);

  const toggleChip = (option: string) => {
    updateForm({
      selectedChips: form.selectedChips.includes(option)
        ? form.selectedChips.filter((item) => item !== option)
        : [...form.selectedChips, option],
    });
    Haptics.selectionAsync().catch(() => {});
  };

  const submit = () => {
    const validationError = validateBookingForm(form, serviceId);
    if (validationError) {
      setError(validationError);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    createMutation.mutate({
      serviceId,
      description: buildDescription(form),
      province: form.province,
      district: form.district || NEW_ADMIN_DISTRICT_VALUE,
      ward: form.ward,
      addressDetail: form.addressDetail.trim(),
      desiredTime: form.timeMode === 'now' ? new Date().toISOString() : form.desiredTime?.toISOString(),
    });
  };

  const pickConditionPhotos = async () => {
    if (conditionPhotos.length >= 3) {
      setError('Bạn đã chọn đủ 3 ảnh hiện trạng.');
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Ứng dụng cần quyền truy cập thư viện ảnh.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 3 - conditionPhotos.length,
        quality: 0.82,
      });
      if (!result.canceled) {
        setConditionPhotos((prev) => [...prev, ...result.assets].slice(0, 3));
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {
      setError('Không thể mở thư viện ảnh.');
    }
  };

  if (serviceId <= 0) {
    return (
      <CustomerScreen contentStyle={styles.centerContent}>
        <EmptyState
          icon="alert-circle-outline"
          title="Dịch vụ không hợp lệ"
          description="Vui lòng quay lại tìm kiếm và chọn một dịch vụ khác."
          actionLabel="Tìm dịch vụ"
          onAction={() => router.replace(routes.tabs.search)}
        />
      </CustomerScreen>
    );
  }

  if (serviceQuery.isLoading || addressesQuery.isLoading) {
    return (
      <CustomerScreen>
        <LoadingState label="Đang chuẩn bị biểu mẫu đặt dịch vụ..." />
      </CustomerScreen>
    );
  }

  return (
    <CustomerScreen>
      {addressOptionsLoading ? <InlineMessage message="Đang tải danh sách địa chỉ hành chính..." /> : null}
      {fallback ? <InlineMessage tone="warning" message="Tạm dùng danh sách tỉnh/phường rút gọn." /> : null}
      {serviceQuery.isError ? <InlineMessage tone="error" message="Không thể tải thông tin dịch vụ." /> : null}
      {oldBookingQuery.isError ? <InlineMessage tone="warning" message="Không thể tải đơn cũ để đặt lại." /> : null}
      {error ? <InlineMessage tone="error" message={error} /> : null}

      <SectionWithIcon title="Dịch vụ đã chọn" icon="briefcase-outline">
        {service ? (
          <CustomerCard>
            <View style={styles.serviceCard}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text variant="titleMedium" style={styles.titleText}>
                  {service.name || 'Dịch vụ'}
                </Text>
                <Text variant="bodySmall" style={styles.subtitle}>
                  {service.provider?.fullName || service.category?.name || 'HomeServe'}
                </Text>
                {service.referencePrice ? (
                  <Text variant="titleSmall" style={styles.priceText}>
                    {formatCurrency(service.referencePrice)}
                  </Text>
                ) : null}
              </View>
              {oldBookingId > 0 ? <StatusChip label="Đặt lại" color={activeColors.info} /> : null}
            </View>
          </CustomerCard>
        ) : (
          <EmptyState
            icon="briefcase-search-outline"
            title="Không tìm thấy dịch vụ"
            description="Dịch vụ có thể đã ngừng hiển thị."
            actionLabel="Tìm dịch vụ khác"
            onAction={() => router.replace(routes.tabs.search)}
          />
        )}
      </SectionWithIcon>

      <SectionWithIcon title="Chi tiết yêu cầu" icon="clipboard-text-outline">
        <CustomerCard>
          <View style={styles.formBlock}>
            {questionnaire.map((block) => (
              <View key={block.q} style={styles.formBlock}>
                <Text variant="labelLarge" style={styles.fieldLabel}>
                  {block.q}
                </Text>
                <View style={styles.chipWrap}>
                  {block.options.map((option) => (
                    <Chip
                      key={option}
                      selected={form.selectedChips.includes(option)}
                      mode={form.selectedChips.includes(option) ? 'flat' : 'outlined'}
                      onPress={() => toggleChip(option)}
                      accessibilityLabel={`Chọn tình trạng ${option}`}
                      style={styles.chip}
                    >
                      {option}
                    </Chip>
                  ))}
                </View>
              </View>
            ))}
            <TextInput
              label="Mô tả thêm"
              mode="outlined"
              value={form.customText}
              onChangeText={(customText) => updateForm({ customText })}
              multiline
              numberOfLines={4}
              placeholder="Ví dụ: thời điểm xuất hiện lỗi, diện tích, yêu cầu riêng..."
            />
          </View>
        </CustomerCard>
      </SectionWithIcon>

      <SectionWithIcon title="Ảnh hiện trạng (tùy chọn)" icon="camera-outline">
        <CustomerCard>
          <View style={styles.formBlock}>
            <Text variant="bodySmall" style={styles.subtitle}>
              Đính kèm ảnh mô tả tình trạng thiết bị/khu vực để thợ chuẩn bị tốt hơn.
            </Text>
            <Button
              mode="outlined"
              icon="image-plus"
              onPress={pickConditionPhotos}
              disabled={conditionPhotos.length >= 3}
              style={styles.roundedButton}
            >
              {conditionPhotos.length >= 3 ? 'Đã chọn đủ 3 ảnh' : `Chọn ảnh (${conditionPhotos.length}/3)`}
            </Button>
            {conditionPhotos.length > 0 ? (
              <View style={styles.photoGrid}>
                {conditionPhotos.map((photo, index) => (
                  <View key={`${photo.uri}-${index}`} style={styles.photoItem}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumb} contentFit="cover" transition={160} />
                    <Pressable
                      style={styles.photoRemoveBtn}
                      onPress={() => {
                        setConditionPhotos((prev) => prev.filter((_, i) => i !== index));
                        Haptics.selectionAsync().catch(() => {});
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Xóa ảnh"
                    >
                      <MaterialCommunityIcons name="close" size={14} color="#FFF" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </CustomerCard>
      </SectionWithIcon>

      <SectionWithIcon title="Địa chỉ" icon="map-marker-outline">
        <View style={styles.formBlock}>
          <SectionHeader title="Địa chỉ đã lưu" subtitle={addresses.length ? 'Chọn nhanh địa chỉ của bạn' : 'Bạn có thể nhập địa chỉ mới bên dưới'} />
          {addresses.length ? (
            <View style={styles.addressList}>
              {addresses.map((address) => (
                <AddressCard
                  key={String(address.id || `${address.addressDetail}-${address.ward}`)}
                  address={address}
                  selected={selectedAddressId === address.id}
                  onPress={() => applyAddress(address)}
                />
              ))}
            </View>
          ) : (
            <InlineMessage tone="neutral" message="Bạn chưa có địa chỉ đã lưu. Hãy nhập địa chỉ mới cho đơn này." />
          )}

          <View style={styles.row}>
            <Button mode="outlined" onPress={() => setProvincePickerOpen(true)} style={styles.flexButton} icon="map-marker-outline">
              {form.province || 'Tỉnh/Thành'}
            </Button>
            <Button mode="outlined" onPress={() => setWardPickerOpen(true)} disabled={!form.province} style={styles.flexButton} icon="map-marker-radius-outline">
              {form.ward || 'Phường/Xã'}
            </Button>
          </View>
          <TextInput
            label="Quận/Huyện"
            mode="outlined"
            value={form.district}
            onChangeText={(district) => updateForm({ district })}
            placeholder={NEW_ADMIN_DISTRICT_VALUE}
          />
          <TextInput
            label="Địa chỉ chi tiết"
            mode="outlined"
            value={form.addressDetail}
            onChangeText={(addressDetail) => updateForm({ addressDetail })}
            placeholder="Số nhà, tên đường, tòa nhà..."
          />
          {form.province && form.ward ? (
            <HelperText type="info" visible>
              {formatAdministrativeArea(form.province, form.ward, form.district)}
            </HelperText>
          ) : null}
        </View>
      </SectionWithIcon>

      <SectionWithIcon title="Thời gian thực hiện" icon="calendar-clock">
        <CustomerCard>
          <View style={styles.formBlock}>
            <View style={styles.row}>
              <Button
                mode={form.timeMode === 'now' ? 'contained-tonal' : 'outlined'}
                onPress={() => updateForm({ timeMode: 'now' })}
                style={[styles.flexButton, form.timeMode === 'now' && { borderColor: activeColors.primary, borderWidth: 1 }]}
                icon="lightning-bolt"
              >
                Làm ngay
              </Button>
              <Button
                mode={form.timeMode === 'scheduled' ? 'contained-tonal' : 'outlined'}
                onPress={() => updateForm({ timeMode: 'scheduled' })}
                style={[styles.flexButton, form.timeMode === 'scheduled' && { borderColor: activeColors.primary, borderWidth: 1 }]}
                icon="calendar-clock"
              >
                Hẹn giờ
              </Button>
            </View>

            {form.timeMode === 'scheduled' && (
              <View style={styles.formBlock}>
                <View style={styles.row}>
                  <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={styles.flexButton} icon="calendar">
                    {form.desiredTime
                      ? new Date(form.desiredTime).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : 'Chọn ngày'}
                  </Button>
                  <Button mode="outlined" onPress={() => setShowTimePicker(true)} style={styles.flexButton} icon="clock-outline">
                    {form.desiredTime
                      ? new Date(form.desiredTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      : 'Chọn giờ'}
                  </Button>
                </View>
                <HelperText type="info" visible>
                  {form.desiredTime ? `Đã chọn: ${formatDateTime(form.desiredTime)}` : 'Chọn ngày và giờ trong tương lai.'}
                </HelperText>
              </View>
            )}
            
            {form.timeMode === 'now' && (
              <HelperText type="info" visible>
                Thợ sẽ cố gắng đến hỗ trợ bạn trong thời gian sớm nhất có thể.
              </HelperText>
            )}
          </View>
        </CustomerCard>
      </SectionWithIcon>

      <SectionWithIcon title="Xác nhận" icon="check-circle-outline">
        <CustomerCard>
          <View style={styles.formBlock}>
            <Text variant="bodySmall" style={styles.subtitle}>
              Đơn sẽ được gửi đến nhà cung cấp để xác nhận và báo giá nếu cần.
            </Text>
            {service?.referencePrice ? (
              <View style={styles.priceSummaryRow}>
                <MaterialCommunityIcons name="tag-outline" size={16} color={activeColors.primary} />
                <Text variant="labelMedium" style={styles.priceSummaryText}>
                  Giá tham khảo: {formatCurrency(service.referencePrice)}
                </Text>
              </View>
            ) : null}
            <Button
              mode="contained"
              icon="check-circle-outline"
              loading={createMutation.isPending}
              disabled={createMutation.isPending || !service}
              onPress={submit}
              style={styles.submitButton}
              contentStyle={styles.submitContent}
            >
              Xác nhận đặt dịch vụ
            </Button>
          </View>
        </CustomerCard>
      </SectionWithIcon>

      {showDatePicker ? (
        <DateTimePicker
          value={form.desiredTime || getDefaultDesiredTime()}
          mode="date"
          minimumDate={new Date()}
          onChange={(_, date) => {
            setShowDatePicker(false);
            if (date) updateForm({ desiredTime: mergeDatePart(form.desiredTime, date) });
          }}
        />
      ) : null}
      {showTimePicker ? (
        <DateTimePicker
          value={form.desiredTime || getDefaultDesiredTime()}
          mode="time"
          onChange={(_, date) => {
            setShowTimePicker(false);
            if (date) updateForm({ desiredTime: mergeTimePart(form.desiredTime, date) });
          }}
        />
      ) : null}

      <OptionPicker
        title="Chọn tỉnh/thành"
        visible={provincePickerOpen}
        options={provinceOptions}
        selectedValue={form.province}
        onSelect={(value) => {
          updateForm({ province: value, ward: '', district: NEW_ADMIN_DISTRICT_VALUE });
          setSelectedAddressId(null);
          setProvincePickerOpen(false);
        }}
        onClose={() => setProvincePickerOpen(false)}
      />
      <OptionPicker
        title="Chọn phường/xã"
        visible={wardPickerOpen}
        options={wardOptions}
        selectedValue={form.ward}
        onSelect={(value) => {
          updateForm({ ward: value });
          setSelectedAddressId(null);
          setWardPickerOpen(false);
        }}
        onClose={() => setWardPickerOpen(false)}
      />
    </CustomerScreen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.section}>
      <Text variant="titleMedium" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function SectionWithIcon({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  children: React.ReactNode;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.section}>
      <View style={styles.sectionIconRow}>
        <View style={styles.sectionIconWrap}>
          <MaterialCommunityIcons name={icon} size={16} color={activeColors.primary} />
        </View>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function AddressCard({
  address,
  selected,
  onPress,
}: {
  address: BookingAddress;
  selected: boolean;
  onPress: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Chọn địa chỉ ${address.label || address.addressDetail || ''}`}
      accessibilityHint="Áp dụng địa chỉ này cho đơn đặt dịch vụ"
      hitSlop={6}
    >
      <CustomerCard style={[styles.addressCard, selected && styles.addressCardSelected]}>
        <View style={styles.addressHeader}>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={styles.titleText} numberOfLines={1}>
              {address.label || 'Địa chỉ'}
            </Text>
            <Text variant="bodySmall" style={styles.subtitle} numberOfLines={2}>
              {address.addressDetail}, {address.ward}, {address.province}
            </Text>
          </View>
          <View style={styles.addressBadgeRow}>
            {address.isDefault ? <StatusChip label="Mặc định" color={activeColors.success} /> : null}
            {selected ? (
              <View style={styles.selectedCheck}>
                <MaterialCommunityIcons name="check" size={14} color="#FFF" />
              </View>
            ) : null}
          </View>
        </View>
      </CustomerCard>
    </Pressable>
  );
}

function OptionPicker({
  title,
  visible,
  options,
  selectedValue,
  onSelect,
  onClose,
}: {
  title: string;
  visible: boolean;
  options: string[];
  selectedValue?: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const [search, setSearch] = useState('');
  const filteredOptions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return options;
    return options.filter((option) => option.toLowerCase().includes(keyword));
  }, [options, search]);

  useEffect(() => {
    if (!visible) setSearch('');
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetGrabber} />
        <View style={styles.sheetHeader}>
          <Text variant="titleLarge" style={styles.sheetTitle}>
            {title}
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" style={styles.closeButton}>
            <MaterialCommunityIcons name="close" size={22} color={activeColors.text} />
          </Pressable>
        </View>
        <TextInput
          label="Tìm kiếm"
          mode="outlined"
          value={search}
          onChangeText={setSearch}
          left={<TextInput.Icon icon="magnify" />}
          right={search ? <TextInput.Icon icon="close-circle-outline" onPress={() => setSearch('')} /> : undefined}
        />
        <ScrollView contentContainerStyle={styles.optionList} keyboardShouldPersistTaps="handled">
          {filteredOptions.length ? (
            filteredOptions.map((option) => (
              <Button
                key={option}
                mode={selectedValue === option ? 'contained-tonal' : 'outlined'}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  onSelect(option);
                }}
                style={styles.optionButton}
                accessibilityLabel={`Chọn ${option}`}
              >
                {option}
              </Button>
            ))
          ) : (
            <EmptyState icon="map-marker-off-outline" title="Không tìm thấy" description="Thử nhập từ khóa khác." />
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  centerContent: { flexGrow: 1, justifyContent: 'center' },
  section: { gap: 10 },
  sectionTitle: { color: activeColors.text, fontWeight: '900' },
  sectionIconRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: activeColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: { color: activeColors.text, fontWeight: '900' },
  subtitle: { color: activeColors.textSecondary, lineHeight: 20 },
  priceText: { color: activeColors.primary, fontWeight: '900' },
  priceSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceSummaryText: { color: activeColors.primary, fontWeight: '900' },
  serviceCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  formBlock: { gap: 12 },
  fieldLabel: { color: activeColors.textSecondary, fontWeight: '800' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderRadius: 999 },
  addressList: { gap: 8 },
  addressCard: { borderColor: activeColors.border },
  addressCardSelected: { borderColor: activeColors.primary, borderWidth: 2 },
  addressHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  addressBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  selectedCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: activeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: 10 },
  flexButton: { flex: 1, borderRadius: 12 },
  submitButton: { borderRadius: 14 },
  submitContent: { height: 52 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.34)' },
  sheet: {
    maxHeight: '76%',
    backgroundColor: activeColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    gap: 12,
  },
  sheetGrabber: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: activeColors.borderStrong,
    alignSelf: 'center',
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sheetTitle: { color: activeColors.text, fontWeight: '900' },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: activeColors.surfaceVariant,
  },
  optionList: { gap: 8, paddingBottom: 18 },
  roundedButton: { borderRadius: 12 },
  // Condition photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoItem: { width: '30%', minWidth: 88, position: 'relative' },
  photoThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: activeColors.surfaceVariant,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(15,23,42,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButton: { borderRadius: 12 },
});
