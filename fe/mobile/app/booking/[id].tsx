/**
 * Booking Detail - provider actions by booking status.
 */
import { useCallback, useEffect, useState } from 'react';
import type { ComponentProps, Dispatch, SetStateAction } from 'react';
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { bookingApi } from '../../features/booking/booking.api';
import { useNotificationStore } from '../../features/notification/notification.store';
import {
  BOOKING_STATUS_LABEL,
  type BookingStatus,
} from '../../constants/booking-status';
import { Colors } from '../../constants/colors';
import {
  ProviderCard,
  ProviderEmptyState,
  ProviderInlineMessage,
  ProviderLoadingState,
  ProviderPageHeader,
  ProviderScreen,
  ProviderSectionHeader,
  ProviderStatusChip,
} from '../../components/provider/provider-ui';

type ImageSetter = Dispatch<SetStateAction<ImagePicker.ImagePickerAsset[]>>;
type MessageState = {
  tone: 'success' | 'warning' | 'error' | 'info';
  text: string;
} | null;

const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    PENDING: Colors.light.statusPending,
    QUOTED: Colors.light.statusQuoted,
    CONFIRMED: Colors.light.statusConfirmed,
    IN_PROGRESS: Colors.light.statusInProgress,
    DONE: Colors.light.statusDone,
    CANCELLED: Colors.light.statusCancelled,
    DISPUTED: Colors.light.statusDisputed,
  };
  return map[status] || Colors.light.textSecondary;
};

export default function BookingDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingSignal = useNotificationStore((state) => state.bookingSignal);

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteEstimatedTime, setQuoteEstimatedTime] = useState('');
  const [quoteNote, setQuoteNote] = useState('');
  const [quoteError, setQuoteError] = useState('');
  const [surveyorName, setSurveyorName] = useState('');
  const [surveyorPhone, setSurveyorPhone] = useState('');
  const [surveyImages, setSurveyImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  const [resultImages, setResultImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);

  const fetchBooking = useCallback(async () => {
    try {
      const res = await bookingApi.getById(Number(id));
      setBooking(res.data?.data);
    } catch {
      setMessage({
        tone: 'error',
        text: 'Không thể tải thông tin đơn hàng. Kéo xuống để thử lại.',
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  useEffect(() => {
    if (bookingSignal?.bookingId === Number(id)) {
      void fetchBooking();
    }
  }, [bookingSignal, fetchBooking, id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setMessage(null);
    await fetchBooking();
    setRefreshing(false);
  }, [fetchBooking]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);

  const pickImages = async (setter: ImageSetter, max = 5) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.75,
      selectionLimit: max,
    });
    if (!result.canceled) {
      setter((prev) => [...prev, ...result.assets].slice(0, max));
      setMessage(null);
    }
  };

  const takePhoto = async (setter: ImageSetter, max = 10) => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75 });
    if (!result.canceled) {
      setter((prev) => [...prev, ...result.assets].slice(0, max));
      setMessage(null);
    }
  };

  const removeResultImage = (indexToRemove: number) => {
    setResultImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
    setMessage(null);
  };

  const handleAcceptBooking = () => {
    Alert.alert(
      'Nhận đơn hàng?',
      'Sau khi nhận đơn, bạn có thể cập nhật thợ khảo sát và gửi báo giá cho khách.',
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Nhận đơn',
          onPress: async () => {
            setActionLoading(true);
            setMessage(null);
            try {
              await bookingApi.acceptBooking(Number(id));
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setMessage({
                tone: 'success',
                text: 'Đã nhận đơn hàng. Vui lòng cập nhật thợ khảo sát.',
              });
              await fetchBooking();
            } catch (err: any) {
              setMessage({
                tone: 'error',
                text:
                  err?.response?.data?.error?.message ||
                  'Không thể nhận đơn hàng.',
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleDeclineBooking = () => {
    Alert.alert(
      'Từ chối đơn hàng?',
      'Khách hàng sẽ được thông báo để tìm thợ khác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            setMessage(null);
            try {
              await bookingApi.declineBooking(Number(id), {
                reason: 'Nhà cung cấp từ chối nhận đơn',
              });
              setMessage({ tone: 'success', text: 'Đã từ chối đơn hàng.' });
              await fetchBooking();
            } catch (err: any) {
              setMessage({
                tone: 'error',
                text:
                  err?.response?.data?.error?.message ||
                  'Không thể từ chối đơn hàng.',
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleConfirmSurveyor = async () => {
    if (!surveyorName.trim() || !surveyorPhone.trim()) {
      setMessage({
        tone: 'warning',
        text: 'Vui lòng nhập đầy đủ tên và số điện thoại thợ khảo sát.',
      });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      await bookingApi.confirmSurveyor(Number(id), {
        surveyorName: surveyorName.trim(),
        surveyorPhone: surveyorPhone.trim(),
      });
      setMessage({
        tone: 'success',
        text: 'Đã cập nhật thông tin thợ khảo sát.',
      });
      await fetchBooking();
    } catch (err: any) {
      setMessage({
        tone: 'error',
        text: err?.response?.data?.error?.message || 'Thao tác thất bại.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendQuote = async () => {
    if (!quotePrice.trim()) {
      setQuoteError('Vui lòng nhập giá thực tế.');
      return;
    }
    if (!quoteEstimatedTime.trim()) {
      setQuoteError('Vui lòng nhập thời gian dự kiến.');
      return;
    }
    if (quoteEstimatedTime.trim().length > 100) {
      setQuoteError('Thời gian dự kiến tối đa 100 ký tự.');
      return;
    }

    setActionLoading(true);
    setQuoteError('');
    try {
      const formData = new FormData();
      formData.append('actualPrice', quotePrice.replace(/[^0-9]/g, ''));
      formData.append('estimatedTime', quoteEstimatedTime.trim());
      if (quoteNote.trim()) formData.append('note', quoteNote.trim());
      surveyImages.forEach((img, index) => {
        formData.append('surveyImages', {
          uri: img.uri,
          name: `survey_${index}.jpg`,
          type: 'image/jpeg',
        } as any);
      });

      await bookingApi.sendQuote(Number(id), formData);
      setShowQuoteModal(false);
      setQuotePrice('');
      setQuoteEstimatedTime('');
      setQuoteNote('');
      setSurveyImages([]);
      setMessage({ tone: 'success', text: 'Đã gửi báo giá cho khách hàng.' });
      await fetchBooking();
    } catch (err: any) {
      setQuoteError(
        err?.response?.data?.error?.message || 'Gửi báo giá thất bại.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = () => {
    Alert.alert('Xác nhận', 'Bắt đầu thực hiện đơn hàng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Bắt đầu',
        onPress: async () => {
          setActionLoading(true);
          setMessage(null);
          try {
            await bookingApi.startWork(Number(id));
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setMessage({
              tone: 'success',
              text: 'Đã bắt đầu thực hiện đơn hàng.',
            });
            await fetchBooking();
          } catch (err: any) {
            setMessage({
              tone: 'error',
              text: err?.response?.data?.error?.message || 'Thao tác thất bại.',
            });
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleComplete = async () => {
    if (resultImages.length === 0) {
      setMessage({
        tone: 'warning',
        text: 'Vui lòng chụp hoặc chọn ảnh kết quả công việc.',
      });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      resultImages.forEach((img, index) => {
        formData.append('resultImages', {
          uri: img.uri,
          name: `result_${index}.jpg`,
          type: 'image/jpeg',
        } as any);
      });
      await bookingApi.completeWork(Number(id), formData);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResultImages([]);
      setMessage({
        tone: 'success',
        text: 'Đã báo hoàn thành. Đang chờ khách hàng nghiệm thu.',
      });
      await fetchBooking();
    } catch (err: any) {
      setMessage({
        tone: 'error',
        text: err?.response?.data?.error?.message || 'Thao tác thất bại.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do hủy.');
      return;
    }

    setActionLoading(true);
    setCancelError('');
    try {
      await bookingApi.cancelBooking(Number(id), {
        reason: cancelReason.trim(),
      });
      setShowCancelModal(false);
      setCancelReason('');
      setMessage({ tone: 'success', text: 'Đã hủy đơn hàng.' });
      await fetchBooking();
    } catch (err: any) {
      setCancelError(
        err?.response?.data?.error?.message || 'Hủy đơn thất bại.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <ProviderScreen>
        <ProviderLoadingState label="Đang tải đơn hàng…" />
      </ProviderScreen>
    );
  }

  if (!booking) {
    return (
      <ProviderScreen scroll>
        <ProviderEmptyState
          icon="clipboard-alert-outline"
          title="Không tìm thấy đơn hàng"
          description="Đơn hàng có thể đã bị xóa hoặc bạn không còn quyền truy cập."
          actionLabel="Quay lại"
          onAction={() => router.back()}
        />
      </ProviderScreen>
    );
  }

  const color = statusColor(booking.status);
  const statusLabel =
    BOOKING_STATUS_LABEL[booking.status as BookingStatus] || booking.status;
  const isAwaitingProviderAcceptance =
    booking.status === 'PENDING' && !booking.providerAcceptedAt;
  const canHandlePendingWorkflow =
    booking.status === 'PENDING' && Boolean(booking.providerAcceptedAt);
  const responseDeadline = booking.providerResponseDeadline
    ? new Date(booking.providerResponseDeadline).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;
  const hasBottomActions = [
    'PENDING',
    'QUOTED',
    'CONFIRMED',
    'IN_PROGRESS',
  ].includes(booking.status);

  return (
    <ProviderScreen>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.light.primary]}
          />
        }
        contentContainerStyle={[
          styles.content,
          hasBottomActions && styles.contentWithActions,
        ]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <ProviderPageHeader
          title={`#${booking.bookingCode}`}
          subtitle="Chi tiết đơn hàng và thao tác xử lý."
          action={
            <IconButton
              icon="arrow-left"
              mode="contained-tonal"
              onPress={() => router.back()}
              accessibilityLabel="Quay lại"
            />
          }
        />

        {message && (
          <ProviderInlineMessage tone={message.tone} message={message.text} />
        )}

        <ProviderCard contentStyle={styles.statusCard}>
          <View style={styles.statusTopRow}>
            <View>
              <Text variant="labelLarge" style={styles.mutedText}>
                Trạng thái đơn
              </Text>
              <Text variant="titleMedium" style={styles.statusTitle}>
                {statusLabel}
              </Text>
            </View>
            <ProviderStatusChip label={statusLabel} color={color} selected />
          </View>
          <View style={styles.statusMetaRow}>
            <MaterialCommunityIcons
              name="calendar-clock-outline"
              size={18}
              color={Colors.light.textSecondary}
            />
            <Text variant="bodySmall" style={styles.mutedText}>
              {booking.desiredTime
                ? new Date(booking.desiredTime).toLocaleString('vi-VN')
                : 'Chưa có lịch'}
            </Text>
          </View>
          {isAwaitingProviderAcceptance && (
            <ProviderInlineMessage
              tone="warning"
              icon="timer-sand"
              message={`Đơn mới cần nhận trong 1 phút${responseDeadline ? `, hạn phản hồi ${responseDeadline}` : ''}.`}
            />
          )}
        </ProviderCard>

        <ProviderCard>
          <ProviderSectionHeader title="Dịch vụ" />
          <Text variant="titleMedium" style={styles.cardTitle} selectable>
            {booking.service?.name || 'Dịch vụ'}
          </Text>
          <Text variant="bodySmall" style={styles.mutedText}>
            {booking.service?.category?.name || 'Chưa có danh mục'}
          </Text>
        </ProviderCard>

        <ProviderCard>
          <ProviderSectionHeader title="Khách hàng" />
          <InfoRow
            icon="account-outline"
            text={booking.customer?.fullName || 'Khách hàng'}
            selectable
          />
          <InfoRow
            icon="phone-outline"
            text={booking.customer?.phone || 'Chưa có số điện thoại'}
            selectable
          />
          <InfoRow
            icon="map-marker-outline"
            text={
              [
                booking.addressDetail,
                booking.ward,
                booking.district,
                booking.province,
              ]
                .filter(Boolean)
                .join(', ') || 'Chưa có địa chỉ'
            }
            selectable
          />
          <InfoRow
            icon="calendar-outline"
            text={
              booking.desiredTime
                ? new Date(booking.desiredTime).toLocaleString('vi-VN')
                : 'Chưa có lịch'
            }
          />
          {booking.note && (
            <View style={styles.noteBox}>
              <Text variant="bodySmall" style={styles.noteText}>
                {booking.note}
              </Text>
            </View>
          )}
        </ProviderCard>

        {booking.quotation && (
          <ProviderCard>
            <ProviderSectionHeader title="Báo giá" />
            <View style={styles.priceRow}>
              <Text variant="bodyMedium" style={styles.mutedText}>
                Giá thực tế
              </Text>
              <Text variant="titleMedium" style={styles.priceText} selectable>
                {formatPrice(Number(booking.quotation.actualPrice))}
              </Text>
            </View>
            {booking.quotation.estimatedTime && (
              <View style={styles.priceRow}>
                <Text variant="bodyMedium" style={styles.mutedText}>
                  Thời gian dự kiến
                </Text>
                <Text variant="bodyMedium" style={styles.cardTitle} selectable>
                  {booking.quotation.estimatedTime}
                </Text>
              </View>
            )}
            {booking.quotation.note && (
              <View style={styles.noteBox}>
                <Text variant="bodySmall" style={styles.noteText}>
                  {booking.quotation.note}
                </Text>
              </View>
            )}
          </ProviderCard>
        )}

        {booking.status === 'DISPUTED' && booking.dispute && (
          <ProviderCard style={styles.disputeCard}>
            <ProviderInlineMessage
              tone="error"
              icon="alert-decagram-outline"
              message={`Khiếu nại từ khách hàng: ${booking.dispute.reason}`}
            />
            {booking.dispute.aiSummary && (
              <View style={styles.noteBox}>
                <Text variant="labelMedium" style={styles.cardTitle}>
                  Tóm tắt hệ thống
                </Text>
                <Text variant="bodySmall" style={styles.noteText}>
                  {booking.dispute.aiSummary}
                </Text>
              </View>
            )}
            {booking.dispute.evidences?.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.evidenceRow}
              >
                {booking.dispute.evidences.map(
                  (evidence: any, index: number) => (
                    <Image
                      key={`${evidence.fileUrl}-${index}`}
                      source={{ uri: evidence.fileUrl }}
                      style={styles.evidenceImage}
                    />
                  ),
                )}
              </ScrollView>
            )}
          </ProviderCard>
        )}

        {canHandlePendingWorkflow && (
          <ProviderCard contentStyle={styles.formSection}>
            <ProviderSectionHeader title="Thợ khảo sát" />
            <TextInput
              label="Tên thợ khảo sát"
              value={surveyorName}
              onChangeText={setSurveyorName}
              mode="outlined"
              left={
                <TextInput.Icon
                  icon="account-hard-hat"
                  accessibilityLabel="Tên thợ khảo sát"
                />
              }
            />
            <TextInput
              label="SĐT thợ khảo sát"
              value={surveyorPhone}
              onChangeText={setSurveyorPhone}
              mode="outlined"
              keyboardType="phone-pad"
              left={
                <TextInput.Icon
                  icon="phone"
                  accessibilityLabel="Số điện thoại thợ khảo sát"
                />
              }
            />
            <Button
              mode="contained"
              onPress={handleConfirmSurveyor}
              loading={actionLoading}
              disabled={actionLoading}
              style={styles.primaryButton}
              icon="check"
            >
              {actionLoading ? 'Đang xử lý…' : 'Xác nhận thợ khảo sát'}
            </Button>
          </ProviderCard>
        )}

        {booking.status === 'IN_PROGRESS' && (
          <ProviderCard contentStyle={styles.formSection}>
            <ProviderSectionHeader title="Ảnh kết quả công việc" />
            <View style={styles.dualButtonRow}>
              <Button
                mode="outlined"
                icon="image-multiple"
                onPress={() => pickImages(setResultImages, 10)}
                style={styles.flexButton}
              >
                Chọn ảnh
              </Button>
              <Button
                mode="outlined"
                icon="camera"
                onPress={() => takePhoto(setResultImages, 10)}
                style={styles.flexButton}
              >
                Chụp ảnh
              </Button>
            </View>
            {resultImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.evidenceRow}
              >
                {resultImages.map((image, index) => (
                  <View key={`${image.uri}-${index}`} style={styles.imageTile}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.evidenceImage}
                    />
                    <IconButton
                      icon="close"
                      mode="contained"
                      size={14}
                      onPress={() => removeResultImage(index)}
                      accessibilityLabel="Xóa ảnh nghiệm thu"
                      style={styles.removeImageButton}
                      iconColor={Colors.light.error}
                    />
                  </View>
                ))}
              </ScrollView>
            )}
          </ProviderCard>
        )}
      </ScrollView>

      {hasBottomActions && (
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.outlineVariant,
            },
          ]}
        >
          {booking.status === 'PENDING' && (
            <>
              {isAwaitingProviderAcceptance ? (
                <>
                  <Button
                    mode="contained"
                    onPress={handleAcceptBooking}
                    loading={actionLoading}
                    disabled={actionLoading}
                    style={styles.actionButton}
                    icon="check-circle-outline"
                    contentStyle={styles.actionContent}
                  >
                    Nhận đơn
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleDeclineBooking}
                    disabled={actionLoading}
                    textColor={Colors.light.error}
                    style={[
                      styles.actionButton,
                      { borderColor: Colors.light.error },
                    ]}
                    icon="close-circle-outline"
                    contentStyle={styles.actionContent}
                  >
                    Từ chối
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    mode="contained"
                    onPress={() => setShowQuoteModal(true)}
                    style={styles.actionButton}
                    icon="file-document-edit-outline"
                    contentStyle={styles.actionContent}
                  >
                    Gửi báo giá
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setShowCancelModal(true)}
                    textColor={Colors.light.error}
                    style={[
                      styles.actionButton,
                      { borderColor: Colors.light.error },
                    ]}
                    icon="close-circle-outline"
                    contentStyle={styles.actionContent}
                  >
                    Hủy đơn
                  </Button>
                </>
              )}
            </>
          )}
          {booking.status === 'QUOTED' && (
            <Button
              mode="outlined"
              onPress={() => setShowCancelModal(true)}
              textColor={Colors.light.error}
              style={[
                styles.actionButton,
                styles.singleAction,
                { borderColor: Colors.light.error },
              ]}
              icon="close-circle-outline"
              contentStyle={styles.actionContent}
            >
              Hủy đơn
            </Button>
          )}
          {booking.status === 'CONFIRMED' && (
            <Button
              mode="contained"
              onPress={handleStart}
              loading={actionLoading}
              disabled={actionLoading}
              style={[styles.actionButton, styles.singleAction]}
              icon="play-circle-outline"
              contentStyle={styles.actionContent}
            >
              {actionLoading ? 'Đang xử lý…' : 'Bắt đầu thực hiện'}
            </Button>
          )}
          {booking.status === 'IN_PROGRESS' && (
            <Button
              mode="contained"
              onPress={handleComplete}
              loading={actionLoading}
              disabled={actionLoading || resultImages.length === 0}
              style={[
                styles.actionButton,
                styles.singleAction,
                { backgroundColor: Colors.light.success },
              ]}
              icon="check-circle-outline"
              contentStyle={styles.actionContent}
            >
              {actionLoading ? 'Đang xử lý…' : 'Hoàn thành'}
            </Button>
          )}
        </View>
      )}

      <Portal>
        <Modal
          visible={showQuoteModal}
          onDismiss={() => {
            setShowQuoteModal(false);
            setQuoteError('');
          }}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Gửi báo giá
          </Text>
          {quoteError ? (
            <ProviderInlineMessage tone="error" message={quoteError} />
          ) : null}
          <TextInput
            label="Giá thực tế (VNĐ)"
            value={quotePrice}
            onChangeText={(value) => {
              setQuotePrice(value);
              setQuoteError('');
            }}
            mode="outlined"
            keyboardType="numeric"
            left={
              <TextInput.Icon icon="cash" accessibilityLabel="Giá thực tế" />
            }
          />
          <TextInput
            label="Thời gian dự kiến"
            value={quoteEstimatedTime}
            onChangeText={(value) => {
              setQuoteEstimatedTime(value);
              setQuoteError('');
            }}
            mode="outlined"
            maxLength={100}
            placeholder="Ví dụ: 2 giờ, 1 ngày"
            left={
              <TextInput.Icon
                icon="timer-outline"
                accessibilityLabel="Thời gian dự kiến"
              />
            }
          />
          <TextInput
            label="Ghi chú"
            value={quoteNote}
            onChangeText={setQuoteNote}
            mode="outlined"
            multiline
            numberOfLines={3}
            left={
              <TextInput.Icon
                icon="note-text"
                accessibilityLabel="Ghi chú báo giá"
              />
            }
          />
          <Button
            mode="outlined"
            icon="image"
            onPress={() => pickImages(setSurveyImages, 5)}
            style={styles.primaryButton}
          >
            Ảnh khảo sát ({surveyImages.length})
          </Button>
          <Button
            mode="contained"
            onPress={handleSendQuote}
            loading={actionLoading}
            disabled={
              actionLoading || !quotePrice.trim() || !quoteEstimatedTime.trim()
            }
            style={styles.primaryButton}
            contentStyle={styles.actionContent}
          >
            {actionLoading ? 'Đang gửi…' : 'Gửi báo giá'}
          </Button>
          <Button mode="text" onPress={() => setShowQuoteModal(false)}>
            Đóng
          </Button>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={showCancelModal}
          onDismiss={() => {
            setShowCancelModal(false);
            setCancelError('');
          }}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            variant="titleMedium"
            style={[styles.modalTitle, { color: Colors.light.error }]}
          >
            Hủy đơn hàng
          </Text>
          {cancelError ? (
            <ProviderInlineMessage tone="error" message={cancelError} />
          ) : null}
          <TextInput
            label="Lý do hủy"
            value={cancelReason}
            onChangeText={(value) => {
              setCancelReason(value);
              setCancelError('');
            }}
            mode="outlined"
            multiline
            numberOfLines={3}
            left={
              <TextInput.Icon
                icon="alert-circle-outline"
                accessibilityLabel="Lý do hủy"
              />
            }
          />
          <Button
            mode="contained"
            onPress={handleCancel}
            loading={actionLoading}
            disabled={actionLoading || !cancelReason.trim()}
            style={[
              styles.primaryButton,
              { backgroundColor: Colors.light.error },
            ]}
            contentStyle={styles.actionContent}
          >
            {actionLoading ? 'Đang xử lý…' : 'Xác nhận hủy'}
          </Button>
          <Button mode="text" onPress={() => setShowCancelModal(false)}>
            Đóng
          </Button>
        </Modal>
      </Portal>
    </ProviderScreen>
  );
}

function InfoRow({
  icon,
  text,
  selectable,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  text: string;
  selectable?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={Colors.light.textSecondary}
      />
      <Text
        variant="bodyMedium"
        style={styles.infoText}
        selectable={selectable}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  contentWithActions: {
    paddingBottom: 128,
  },
  statusCard: {
    gap: 12,
  },
  statusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  statusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mutedText: {
    color: Colors.light.textSecondary,
  },
  statusTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    marginTop: 2,
  },
  cardTitle: {
    color: Colors.light.text,
    fontWeight: '800',
    marginTop: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    color: Colors.light.text,
    lineHeight: 20,
  },
  noteBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceVariant,
  },
  noteText: {
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10,
  },
  priceText: {
    color: Colors.light.primary,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  disputeCard: {
    borderColor: `${Colors.light.error}40`,
  },
  evidenceRow: {
    gap: 10,
    paddingTop: 10,
  },
  evidenceImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceVariant,
  },
  imageTile: {
    position: 'relative',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    margin: 0,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  formSection: {
    gap: 12,
  },
  dualButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flexButton: {
    flex: 1,
    borderRadius: 12,
  },
  primaryButton: {
    borderRadius: 12,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    paddingBottom: 28,
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  singleAction: {
    flex: 1,
  },
  actionContent: {
    height: 48,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 18,
    gap: 12,
  },
  modalTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
});
