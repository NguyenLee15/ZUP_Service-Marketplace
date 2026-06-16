import { useActiveColors } from '../../../hooks/useActiveColors';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import {
  CustomerCard,
  EmptyState,
  InlineMessage,
  LoadingState,
  StatusChip,
} from '../../../components/customer/customer-ui';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from '../../../constants/booking-status';
import { Colors } from '../../../constants/colors';
import { bookingApi } from '../../../features/booking/booking.api';
import { getApiErrorMessage, unwrapData } from '../../../lib/api-response';
import { formatDateTime } from '../../../lib/format';
import { routes } from '../../../lib/route-utils';

const MAX_REASON_LENGTH = 1000;
const MIN_REASON_LENGTH = 10;
const MAX_EVIDENCES = 5;

type DisputeEvidence = {
  id?: number | string;
  type?: string | null;
  fileUrl?: string | null;
};

type BookingDispute = {
  id?: number | string;
  reason?: string | null;
  status?: string | null;
  createdAt?: string | null;
  evidences?: DisputeEvidence[] | null;
};

type DisputeBooking = {
  id?: number | string;
  bookingCode?: string | null;
  status?: string | null;
  completedAt?: string | Date | null;
  autoCompletedAt?: string | Date | null;
  desiredTime?: string | Date | null;
  service?: {
    id?: number | string;
    name?: string | null;
  } | null;
  provider?: {
    id?: number | string;
    fullName?: string | null;
  } | null;
  dispute?: BookingDispute | null;
};

function isValidBookingId(value: number) {
  return Number.isFinite(value) && value > 0;
}

function getExistingDispute(booking?: DisputeBooking | null) {
  return booking?.dispute || null;
}

function canDisputeBooking(booking?: DisputeBooking | null) {
  return Boolean(booking && booking.status === 'DONE' && !getExistingDispute(booking));
}

const DISPUTE_CATEGORIES = [
  { label: 'Giá phát sinh bất thường', value: 'giá phát sinh' },
  { label: 'Chất lượng không đảm bảo', value: 'chất lượng' },
  { label: 'Thợ không đến', value: 'thợ không đến' },
  { label: 'Hư hỏng tài sản', value: 'hư hỏng tài sản' },
  { label: 'Khác', value: '' },
];

function validateDisputeForm(reason: string, evidences: ImagePicker.ImagePickerAsset[]) {
  const trimmedReason = reason.trim();
  if (trimmedReason.length < MIN_REASON_LENGTH) {
    return `Vui lòng mô tả tranh chấp ít nhất ${MIN_REASON_LENGTH} ký tự.`;
  }
  if (trimmedReason.length > MAX_REASON_LENGTH) {
    return `Nội dung tranh chấp tối đa ${MAX_REASON_LENGTH} ký tự.`;
  }
  if (evidences.length > MAX_EVIDENCES) {
    return `Chỉ được đính kèm tối đa ${MAX_EVIDENCES} ảnh minh chứng.`;
  }
  return '';
}

function appendEvidenceFile(formData: FormData, image: ImagePicker.ImagePickerAsset, index: number) {
  formData.append('evidences', {
    uri: image.uri,
    type: image.mimeType || 'image/jpeg',
    name: image.fileName || `evidence-${index + 1}.jpg`,
  } as any);
}

function getDisputeStatusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    PENDING: 'Đang chờ xử lý',
    IN_REVIEW: 'Đang xem xét',
    RESOLVED: 'Đã xử lý',
  };
  return labels[String(status || '')] || status || 'Đã gửi';
}

export default function DisputeScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const bookingId = Number(id);
  const validBookingId = isValidBookingId(bookingId);
  const [reason, setReason] = useState('');
  const [disputeCategory, setDisputeCategory] = useState('');
  const [evidences, setEvidences] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const bookingQuery = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => unwrapData<DisputeBooking>(await bookingApi.getById(bookingId)),
    enabled: validBookingId,
  });

  const booking = bookingQuery.data;
  const existingDispute = getExistingDispute(booking);
  const eligible = canDisputeBooking(booking);
  const validationMessage = useMemo(
    () => validateDisputeForm(reason, evidences),
    [reason, evidences],
  );

  const disputeMutation = useMutation({
    mutationFn: async () => {
      const fullReason = disputeCategory
        ? `[${disputeCategory.toUpperCase()}] ${reason.trim()}`
        : reason.trim();
      const formData = new FormData();
      formData.append('reason', fullReason);
      evidences.forEach((image, index) => appendEvidenceFile(formData, image, index));
      return bookingApi.dispute(bookingId, formData);
    },
    onSuccess: async () => {
      setMessage('');
      setSuccessMessage('Đã gửi tranh chấp. Bộ phận hỗ trợ sẽ xem xét thông tin.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['booking', bookingId] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setTimeout(() => {
        router.replace(routes.booking.detail(String(bookingId)));
      }, 750);
    },
    onError: (error) => {
      setSuccessMessage('');
      setMessage(getApiErrorMessage(error, 'Không thể gửi tranh chấp.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
  });

  const pickImages = async () => {
    setMessage('');
    if (evidences.length >= MAX_EVIDENCES) {
      setMessage(`Bạn đã chọn đủ ${MAX_EVIDENCES} ảnh minh chứng.`);
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setMessage('Ứng dụng cần quyền truy cập thư viện ảnh để chọn minh chứng.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: MAX_EVIDENCES - evidences.length,
        quality: 0.8,
      });
      if (result.canceled) return;
      const nextImages = [...evidences, ...result.assets].slice(0, MAX_EVIDENCES);
      setEvidences(nextImages);
      Haptics.selectionAsync().catch(() => {});
    } catch {
      setMessage('Không thể mở thư viện ảnh. Vui lòng thử lại.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const captureImage = async () => {
    setMessage('');
    if (evidences.length >= MAX_EVIDENCES) {
      setMessage(`Bạn đã chọn đủ ${MAX_EVIDENCES} ảnh minh chứng.`);
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setMessage('Ứng dụng cần quyền truy cập camera.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.82,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        setEvidences((prev) => [...prev, ...result.assets].slice(0, MAX_EVIDENCES));
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {
      setMessage('Không thể mở camera. Vui lòng thử lại.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const removeEvidence = (index: number) => {
    setEvidences((current) => current.filter((_, itemIndex) => itemIndex !== index));
    Haptics.selectionAsync().catch(() => {});
  };

  const submit = () => {
    setMessage('');
    setSuccessMessage('');

    const nextValidationMessage = validateDisputeForm(reason, evidences);
    if (nextValidationMessage) {
      setMessage(nextValidationMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    if (!eligible) {
      setMessage('Đơn hàng chưa đủ điều kiện gửi tranh chấp hoặc đã có tranh chấp.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    disputeMutation.mutate();
  };

  const goToBookingDetail = () => {
    router.replace(routes.booking.detail(validBookingId ? String(bookingId) : ''));
  };

  if (!validBookingId) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="alert-circle-outline"
          title="Đơn hàng không hợp lệ"
          description="Vui lòng quay lại danh sách đơn hàng."
          actionLabel="Về đơn hàng"
          onAction={() => router.replace(routes.tabs.bookings)}
        />
      </View>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <View style={styles.screen}>
        <LoadingState label="Đang tải thông tin tranh chấp..." />
      </View>
    );
  }

  if (bookingQuery.isError || !booking) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <InlineMessage
          tone="error"
          message={getApiErrorMessage(bookingQuery.error, 'Không thể tải thông tin đơn hàng.')}
        />
        <EmptyState
          icon="clipboard-alert-outline"
          title="Không tìm thấy đơn hàng"
          description="Đơn hàng có thể không tồn tại hoặc bạn không có quyền xem."
          actionLabel="Về đơn hàng"
          onAction={() => router.replace(routes.tabs.bookings)}
        />
        <Button mode="outlined" icon="refresh" onPress={() => bookingQuery.refetch()} style={styles.roundedButton}>
          Thử lại
        </Button>
      </ScrollView>
    );
  }

  if (existingDispute) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Header booking={booking} />
        <BookingSummary booking={booking} />
        <InlineMessage tone="warning" message="Đơn hàng này đã có tranh chấp đang được xử lý." />
        <ExistingDisputeCard dispute={existingDispute} />
        <Button mode="contained" onPress={goToBookingDetail} style={styles.roundedButton}>
          Về chi tiết đơn
        </Button>
      </ScrollView>
    );
  }

  if (!eligible) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Header booking={booking} />
        <BookingSummary booking={booking} />
        <InlineMessage
          tone="warning"
          message="Chỉ có thể gửi tranh chấp khi đơn hàng đã hoàn thành và chưa có tranh chấp."
        />
        <Button mode="contained" onPress={goToBookingDetail} style={styles.roundedButton}>
          Về chi tiết đơn
        </Button>
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Header booking={booking} />
        <BookingSummary booking={booking} />

        <DisputeWarningCard />
        {message ? <InlineMessage tone="error" message={message} /> : null}
        {successMessage ? <InlineMessage tone="success" message={successMessage} /> : null}

        <CustomerCard>
          <View style={styles.cardBlock}>
            <Text variant="titleMedium" style={styles.titleText}>
              Loại tranh chấp
            </Text>
            <View style={styles.categoryRow}>
              {DISPUTE_CATEGORIES.map((cat) => (
                <Chip
                  key={cat.label}
                  selected={disputeCategory === cat.value}
                  mode={disputeCategory === cat.value ? 'flat' : 'outlined'}
                  onPress={() => {
                    setDisputeCategory(cat.value);
                    Haptics.selectionAsync().catch(() => {});
                  }}
                  style={styles.categoryChip}
                >
                  {cat.label}
                </Chip>
              ))}
            </View>
          </View>
        </CustomerCard>

        <CustomerCard>
          <View style={styles.cardBlock}>
            <View style={styles.rowBetween}>
              <Text variant="titleMedium" style={styles.titleText}>
                Nội dung tranh chấp
              </Text>
              <Text
                variant="labelSmall"
                style={[
                  styles.counter,
                  reason.length > MAX_REASON_LENGTH ? styles.counterError : null,
                ]}
              >
                {reason.length}/{MAX_REASON_LENGTH}
              </Text>
            </View>
            <TextInput
              label="Mô tả vấn đề"
              mode="outlined"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={7}
              maxLength={MAX_REASON_LENGTH + 50}
              placeholder="Ví dụ: công việc chưa hoàn tất, kết quả không đúng thỏa thuận, phát sinh chi phí không rõ..."
            />
            {validationMessage && reason.trim().length > 0 ? (
              <InlineMessage tone="warning" message={validationMessage} />
            ) : null}
          </View>
        </CustomerCard>

        <CustomerCard>
          <View style={styles.cardBlock}>
            <View style={styles.rowBetween}>
              <Text variant="titleMedium" style={styles.titleText}>
                Minh chứng
              </Text>
              <Text variant="labelSmall" style={styles.counter}>
                {evidences.length}/{MAX_EVIDENCES} ảnh
              </Text>
            </View>
            <View style={styles.evidenceActions}>
              <Button
                mode="outlined"
                icon="image-multiple-outline"
                onPress={pickImages}
                disabled={evidences.length >= MAX_EVIDENCES || disputeMutation.isPending}
                style={styles.evidenceBtn}
              >
                Thư viện
              </Button>
              <Button
                mode="outlined"
                icon="camera-outline"
                onPress={captureImage}
                disabled={evidences.length >= MAX_EVIDENCES || disputeMutation.isPending}
                style={styles.evidenceBtn}
              >
                Chụp ảnh
              </Button>
            </View>
            {evidences.length ? (
              <View style={styles.evidenceGrid}>
                {evidences.map((image, index) => (
                  <EvidencePreview
                    key={`${image.uri}-${index}`}
                    image={image}
                    index={index}
                    onRemove={() => removeEvidence(index)}
                  />
                ))}
              </View>
            ) : (
              <Text variant="bodySmall" style={styles.subtitle}>
                Bạn có thể đính kèm ảnh kết quả, hóa đơn, tin nhắn hoặc hiện trạng dịch vụ.
              </Text>
            )}
          </View>
        </CustomerCard>

        <Button
          mode="contained"
          icon="send-outline"
          loading={disputeMutation.isPending}
          disabled={disputeMutation.isPending || Boolean(validationMessage)}
          onPress={submit}
          style={styles.submitButton}
          contentStyle={styles.submitContent}
        >
          Gửi tranh chấp
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Header({ booking }: { booking: DisputeBooking }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.headerBlock}>
      <Text variant="headlineSmall" style={styles.headerTitle}>
        Gửi tranh chấp
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle} numberOfLines={1}>
        {booking.service?.name || 'Dịch vụ'} · {booking.provider?.fullName || 'Nhà cung cấp'}
      </Text>
    </View>
  );
}

function BookingSummary({ booking }: { booking: DisputeBooking }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const status = booking.status || 'DONE';
  const statusColor = BOOKING_STATUS_COLOR[status] || activeColors.textSecondary;
  const completedAt = booking.completedAt || booking.autoCompletedAt;

  return (
    <CustomerCard>
      <View style={styles.cardBlock}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text variant="labelSmall" style={styles.codeText} selectable>
              #{booking.bookingCode || booking.id}
            </Text>
            <Text variant="titleMedium" style={styles.titleText} numberOfLines={2}>
              {booking.service?.name || 'Dịch vụ'}
            </Text>
          </View>
          <StatusChip label={BOOKING_STATUS_LABEL[status] || status} color={statusColor} />
        </View>
        <InfoRow icon="account-hard-hat-outline" text={booking.provider?.fullName || 'Nhà cung cấp'} />
        <InfoRow icon="calendar-check-outline" text={`Hoàn thành: ${formatDateTime(completedAt)}`} />
        <InfoRow icon="calendar-clock" text={`Lịch hẹn: ${formatDateTime(booking.desiredTime)}`} />
      </View>
    </CustomerCard>
  );
}

function ExistingDisputeCard({ dispute }: { dispute: BookingDispute }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const evidences = dispute.evidences || [];

  return (
    <CustomerCard>
      <View style={styles.cardBlock}>
        <View style={styles.rowBetween}>
          <Text variant="titleMedium" style={styles.titleText}>
            Trạng thái tranh chấp
          </Text>
          <StatusChip label={getDisputeStatusLabel(dispute.status)} color={activeColors.warning} />
        </View>
        <Text variant="bodyMedium" style={styles.reasonText}>
          {dispute.reason || 'Chưa có nội dung tranh chấp.'}
        </Text>
        {dispute.createdAt ? (
          <Text variant="labelSmall" style={styles.subtitle}>
            Gửi lúc {formatDateTime(dispute.createdAt)}
          </Text>
        ) : null}
        {evidences.length ? (
          <View style={styles.evidenceGrid}>
            {evidences.map((evidence, index) =>
              evidence.fileUrl ? (
                <Image
                  key={String(evidence.id || evidence.fileUrl || index)}
                  source={{ uri: evidence.fileUrl }}
                  style={styles.evidenceImage}
                  contentFit="cover"
                  transition={160}
                />
              ) : null,
            )}
          </View>
        ) : null}
      </View>
    </CustomerCard>
  );
}

function EvidencePreview({
  image,
  index,
  onRemove,
}: {
  image: ImagePicker.ImagePickerAsset;
  index: number;
  onRemove: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.evidenceItem}>
      <Image source={{ uri: image.uri }} style={styles.evidenceImage} contentFit="cover" transition={160} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Xóa ảnh minh chứng"
        onPress={onRemove}
        style={styles.removeButton}
      >
        <MaterialCommunityIcons name="close" size={16} color="#FFFFFF" />
      </Pressable>
      <Text variant="labelSmall" style={styles.fileName} numberOfLines={1}>
        {image.fileName || `Ảnh ${index + 1}`}
      </Text>
    </View>
  );
}

function InfoRow({ icon, text }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; text: string }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={17} color={activeColors.textSecondary} />
      <Text variant="bodySmall" style={styles.infoText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function DisputeWarningCard() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.warningCard}>
      <MaterialCommunityIcons name="scale-balance" size={24} color={activeColors.warning} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text variant="titleSmall" style={styles.warningTitle}>
          Lưu ý khi khiếu nại
        </Text>
        <Text variant="bodySmall" style={styles.warningText}>
          Khi bạn gửi yêu cầu tranh chấp, trạng thái đơn hàng sẽ được khóa ở mức "Đang tranh chấp" cho đến khi có phán quyết cuối cùng từ Ban quản trị. Hãy cung cấp đầy đủ thông tin và hình ảnh minh chứng để đảm bảo quyền lợi tốt nhất.
        </Text>
      </View>
    </View>
  );
}


const getStyles = (activeColors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: activeColors.background },
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  headerBlock: { gap: 5, paddingTop: 12 },
  headerTitle: { color: activeColors.text, fontWeight: '900' },
  subtitle: { color: activeColors.textSecondary, lineHeight: 20 },
  cardBlock: { gap: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  codeText: { color: activeColors.primary, fontWeight: '900' },
  titleText: { color: activeColors.text, fontWeight: '900' },
  reasonText: { color: activeColors.text, lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  infoText: { flex: 1, color: activeColors.textSecondary, lineHeight: 19 },
  counter: { color: activeColors.textSecondary, fontWeight: '800' },
  counterError: { color: activeColors.error },
  evidenceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  evidenceItem: { width: '30%', minWidth: 92, gap: 5 },
  evidenceImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: activeColors.surfaceVariant,
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: { color: activeColors.textSecondary, fontWeight: '700' },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: `${activeColors.warning}18`,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: `${activeColors.warning}50`,
    padding: 14,
  },
  warningTitle: { color: activeColors.text, fontWeight: '900' },
  warningText: { color: activeColors.textSecondary, lineHeight: 20 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { borderRadius: 999 },
  evidenceActions: { flexDirection: 'row', gap: 10 },
  evidenceBtn: { flex: 1, borderRadius: 12 },
  roundedButton: { borderRadius: 12 },
  submitButton: { borderRadius: 14 },
  submitContent: { minHeight: 48 },
});
