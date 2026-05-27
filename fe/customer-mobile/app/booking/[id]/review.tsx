import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
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
import { reviewApi } from '../../../features/review/review.api';
import { getApiErrorMessage, unwrapData } from '../../../lib/api-response';
import { formatDateTime } from '../../../lib/format';
import { routes } from '../../../lib/route-utils';
import { useInAppReview } from '../../../hooks/useInAppReview';

const MAX_COMMENT_LENGTH = 1000;

type BookingReview = {
  id?: number | string;
  rating?: number | string | null;
  comment?: string | null;
  createdAt?: string | null;
};

type ReviewBooking = {
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
  review?: BookingReview | null;
};

function isValidBookingId(value: number) {
  return Number.isFinite(value) && value > 0;
}

function getExistingReview(booking?: ReviewBooking | null) {
  return booking?.review || null;
}

function canReviewBooking(booking?: ReviewBooking | null) {
  // Nới lịng: chỉ cần DONE + completedAt + chưa review
  return Boolean(
    booking &&
      booking.status === 'DONE' &&
      (booking.completedAt || booking.autoCompletedAt) &&
      !getExistingReview(booking),
  );
}

function getRatingLabel(rating: number) {
  const labels: Record<number, string> = {
    1: 'Rất không hài lòng',
    2: 'Không hài lòng',
    3: 'Bình thường',
    4: 'Hài lòng',
    5: 'Rất hài lòng',
  };
  return labels[rating] || 'Chọn mức hài lòng';
}

function validateReviewForm(rating: number, comment: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return 'Vui lòng chọn điểm đánh giá từ 1 đến 5.';
  }
  if (comment.trim().length > MAX_COMMENT_LENGTH) {
    return `Nhận xét tối đa ${MAX_COMMENT_LENGTH} ký tự.`;
  }
  return '';
}

function getServiceId(booking?: ReviewBooking | null) {
  const id = Number(booking?.service?.id);
  return Number.isFinite(id) && id > 0 ? id : null;
}

const QUICK_TAGS = ['Đúng giờ', 'Chuyên nghiệp', 'Sạch sẽ', 'Giá hợp lý', 'Tư vấn tốt', 'Nhanh chóng'];

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { triggerReview } = useInAppReview();
  const queryClient = useQueryClient();
  const bookingId = Number(id);
  const validBookingId = isValidBookingId(bookingId);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const starAnims = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  const bookingQuery = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => unwrapData<ReviewBooking>(await bookingApi.getById(bookingId)),
    enabled: validBookingId,
  });

  const booking = bookingQuery.data;
  const existingReview = getExistingReview(booking);
  const eligible = canReviewBooking(booking);
  const serviceId = getServiceId(booking);
  const validationMessage = useMemo(() => validateReviewForm(rating, comment), [rating, comment]);

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const trimmedComment = comment.trim();
      return reviewApi.create({
        bookingId,
        rating,
        comment: trimmedComment || undefined,
      });
    },
    onSuccess: async () => {
      setMessage('');
      setSuccessMessage('Đã gửi đánh giá. Cảm ơn bạn đã phản hồi.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['booking', bookingId] }),
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        serviceId
          ? queryClient.invalidateQueries({ queryKey: ['service', serviceId, 'detail'] })
          : Promise.resolve(),
      ]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      triggerReview().catch(() => {});
      setTimeout(() => {
        router.replace(routes.booking.detail(String(bookingId)));
      }, 650);
    },
    onError: (error) => {
      setSuccessMessage('');
      setMessage(getApiErrorMessage(error, 'Không thể gửi đánh giá.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
  });

  const submit = () => {
    setMessage('');
    setSuccessMessage('');
    const nextValidationMessage = validateReviewForm(rating, comment);
    if (nextValidationMessage) {
      setMessage(nextValidationMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    if (!eligible) {
      setMessage('Đơn hàng chưa đủ điều kiện đánh giá hoặc đã được đánh giá.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    reviewMutation.mutate();
  };

  const selectStar = (star: number) => {
    setRating(star);
    // Spring animation cho sao được chọn
    const anim = starAnims[star - 1];
    Animated.sequence([
      Animated.spring(anim, { toValue: 1.4, useNativeDriver: true, speed: 30 }),
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const appendTag = (tag: string) => {
    setComment((prev) => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}, ${tag}` : tag;
    });
    Haptics.selectionAsync().catch(() => {});
  };

  const goToBookingDetail = () => {
    router.replace(routes.booking.detail(validBookingId ? String(bookingId) : ''));
  };

  if (!validBookingId) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="star-off-outline"
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
        <LoadingState label="Đang tải thông tin đánh giá..." />
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

  if (existingReview) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Header booking={booking} />
        <BookingSummary booking={booking} />
        <InlineMessage tone="success" message="Bạn đã đánh giá đơn hàng này." />
        <ExistingReviewCard review={existingReview} />
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
          message={
            booking.status !== 'DONE'
              ? 'Chỉ có thể đánh giá khi đơn hàng đã hoàn thành.'
              : 'Bạn cần nghiệm thu đơn hàng trước khi gửi đánh giá.'
          }
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

        {message ? <InlineMessage tone="error" message={message} /> : null}
        {successMessage ? <InlineMessage tone="success" message={successMessage} /> : null}

        <CustomerCard>
          <View style={styles.cardBlock}>
            <Text variant="titleMedium" style={styles.titleText}>
              Mức độ hài lòng
            </Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  accessibilityRole="button"
                  accessibilityLabel={`Chọn ${star} sao`}
                  onPress={() => selectStar(star)}
                  style={styles.starButton}
                >
                  <Animated.View style={{ transform: [{ scale: starAnims[star - 1] }] }}>
                    <MaterialCommunityIcons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={34}
                      color={star <= rating ? '#FBBF24' : Colors.light.borderStrong}
                    />
                  </Animated.View>
                </Pressable>
              ))}
            </View>
            <Text variant="titleSmall" style={styles.ratingLabel}>
              {rating}.0 · {getRatingLabel(rating)}
            </Text>
          </View>
        </CustomerCard>

        <CustomerCard>
          <View style={styles.cardBlock}>
            <View style={styles.rowBetween}>
              <Text variant="titleMedium" style={styles.titleText}>
                Nhận xét
              </Text>
              <Text
                variant="labelSmall"
                style={[
                  styles.counter,
                  comment.length > MAX_COMMENT_LENGTH ? styles.counterError : null,
                ]}
              >
                {comment.length}/{MAX_COMMENT_LENGTH}
              </Text>
            </View>
            {/* Quick tags */}
            <View style={styles.tagRow}>
              {QUICK_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  mode="outlined"
                  compact
                  onPress={() => appendTag(tag)}
                  style={styles.tagChip}
                >
                  {tag}
                </Chip>
              ))}
            </View>
            <TextInput
              label="Chia sẻ trải nghiệm của bạn"
              mode="outlined"
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={6}
              maxLength={MAX_COMMENT_LENGTH + 50}
              placeholder="Ví dụ: nhà cung cấp đến đúng giờ, xử lý sạch sẽ, tư vấn rõ ràng..."
            />
          </View>
        </CustomerCard>

        <Button
          mode="contained"
          icon="send-outline"
          loading={reviewMutation.isPending}
          disabled={reviewMutation.isPending || Boolean(validationMessage)}
          onPress={submit}
          style={styles.submitButton}
          contentStyle={styles.submitContent}
        >
          Gửi đánh giá
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Header({ booking }: { booking: ReviewBooking }) {
  return (
    <View style={styles.headerBlock}>
      <Text variant="headlineSmall" style={styles.headerTitle}>
        Đánh giá dịch vụ
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle} numberOfLines={1}>
        {booking.service?.name || 'Dịch vụ'} · {booking.provider?.fullName || 'Nhà cung cấp'}
      </Text>
    </View>
  );
}

function BookingSummary({ booking }: { booking: ReviewBooking }) {
  const status = booking.status || 'DONE';
  const statusColor = BOOKING_STATUS_COLOR[status] || Colors.light.textSecondary;
  const completedAt = booking.autoCompletedAt || booking.completedAt;

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
        {/* Provider avatar + name */}
        <View style={styles.providerRow}>
          <View style={styles.providerAvatar}>
            <Text style={styles.providerInitial}>
              {(booking.provider?.fullName || 'N').trim().charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text variant="titleSmall" style={styles.titleText} numberOfLines={1}>
            {booking.provider?.fullName || 'Nhà cung cấp'}
          </Text>
        </View>
        <InfoRow icon="calendar-check-outline" text={`Nghiệm thu: ${formatDateTime(completedAt)}`} />
        <InfoRow icon="calendar-clock" text={`Lịch hẹn: ${formatDateTime(booking.desiredTime)}`} />
      </View>
    </CustomerCard>
  );
}

function ExistingReviewCard({ review }: { review: BookingReview }) {
  const rating = Number(review.rating || 0);

  return (
    <CustomerCard>
      <View style={styles.cardBlock}>
        <View style={styles.starRowSmall}>
          {[1, 2, 3, 4, 5].map((star) => (
            <MaterialCommunityIcons
              key={star}
              name={star <= rating ? 'star' : 'star-outline'}
              size={22}
              color={star <= rating ? '#FBBF24' : Colors.light.borderStrong}
            />
          ))}
          <Text variant="labelMedium" style={styles.ratingLabel}>
            {rating.toFixed(1)}
          </Text>
        </View>
        {review.comment ? (
          <Text variant="bodyMedium" style={styles.commentText}>
            {review.comment}
          </Text>
        ) : (
          <Text variant="bodyMedium" style={styles.subtitle}>
            Bạn chưa để lại nhận xét.
          </Text>
        )}
        {review.createdAt ? (
          <Text variant="labelSmall" style={styles.subtitle}>
            {formatDateTime(review.createdAt)}
          </Text>
        ) : null}
      </View>
    </CustomerCard>
  );
}

function InfoRow({ icon, text }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; text: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={17} color={Colors.light.textSecondary} />
      <Text variant="bodySmall" style={styles.infoText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  headerBlock: { gap: 5, paddingTop: 12 },
  headerTitle: { color: Colors.light.text, fontWeight: '900' },
  subtitle: { color: Colors.light.textSecondary, lineHeight: 20 },
  cardBlock: { gap: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  codeText: { color: Colors.light.primary, fontWeight: '900' },
  titleText: { color: Colors.light.text, fontWeight: '900' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  infoText: { flex: 1, color: Colors.light.textSecondary, lineHeight: 19 },
  starRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  starRowSmall: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  starButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.light.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingLabel: { color: Colors.light.text, fontWeight: '900' },
  counter: { color: Colors.light.textSecondary, fontWeight: '800' },
  counterError: { color: Colors.light.error },
  commentText: { color: Colors.light.text, lineHeight: 22 },
  roundedButton: { borderRadius: 12 },
  submitButton: { borderRadius: 14 },
  submitContent: { minHeight: 48 },
  // Quick tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  tagChip: { borderRadius: 999 },
  // Provider row
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  providerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInitial: { color: '#FFF', fontWeight: '900', fontSize: 13 },
});
