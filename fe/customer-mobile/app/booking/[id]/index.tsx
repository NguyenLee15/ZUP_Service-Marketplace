import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, TextInput } from 'react-native-paper';
import { BottomActionBar, ConfirmSheet, EmptyState, InlineMessage } from '../../../components/customer/customer-ui';
import { getBookingStatusColor } from '../../../constants/booking-status';
import { bookingApi } from '../../../features/booking/booking.api';
import { CustomerBookingHeader } from '../../../features/booking/components/CustomerBookingHeader';
import { CustomerBookingTimeline } from '../../../features/booking/components/CustomerBookingTimeline';
import { CustomerDisputeSection } from '../../../features/booking/components/CustomerDisputeSection';
import { CustomerProviderInfoCard } from '../../../features/booking/components/CustomerProviderInfoCard';
import { CustomerQuotationCard } from '../../../features/booking/components/CustomerQuotationCard';
import type { CustomerBookingDetail, CustomerBookingTimelineItem } from '../../../features/booking/components/customer-booking-detail.types';
import { chatApi } from '../../../features/chat/chat.api';
import { useActiveColors } from '../../../hooks/useActiveColors';
import { getApiErrorMessage, unwrapData } from '../../../lib/api-response';
import { exportBookingReceiptPdf } from '../../../lib/customer-pdf-export';
import { toRouteId, routes } from '../../../lib/route-utils';

type BookingAction = 'confirm' | 'reject' | 'cancel' | 'accept' | 'rebook';
type Sheet = 'reject' | 'cancel' | 'accept' | null;

function getConversationId(payload: unknown) {
  const data: any = unwrapData(payload);
  return data?.id ?? data?.conversation?.id ?? data?.data?.id ?? data?.data?.conversation?.id;
}

function getRebookTargetId(payload: unknown) {
  const data: any = unwrapData(payload);
  return data?.id ?? data?.booking?.id ?? data?.data?.id ?? data?.data?.booking?.id;
}

export default function BookingDetailScreen() {
  const colors = useActiveColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingId = Number(id);
  const validBookingId = Number.isFinite(bookingId) && bookingId > 0;
  const [reason, setReason] = useState('');
  const [sheet, setSheet] = useState<Sheet>(null);
  const [message, setMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const bookingQuery = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => unwrapData<CustomerBookingDetail>(await bookingApi.getById(bookingId)),
    enabled: validBookingId,
  });
  const timelineQuery = useQuery({
    queryKey: ['booking', bookingId, 'timeline'],
    queryFn: async () => unwrapData<CustomerBookingTimelineItem[]>(await bookingApi.getTimeline(bookingId)),
    enabled: validBookingId,
  });
  const booking = bookingQuery.data;

  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['booking', bookingId] }),
    queryClient.invalidateQueries({ queryKey: ['booking', bookingId, 'timeline'] }),
    queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  ]);
  const actionMutation = useMutation({
    mutationFn: ({ type }: { type: BookingAction }) => {
      if (type === 'confirm') return bookingApi.confirmQuote(bookingId);
      if (type === 'reject') return bookingApi.rejectQuote(bookingId, reason.trim());
      if (type === 'cancel') return bookingApi.cancelByCustomer(bookingId, reason.trim());
      if (type === 'accept') return bookingApi.acceptCompletion(bookingId);
      return bookingApi.rebook(bookingId);
    },
    onSuccess: async (response, { type }) => {
      setSheet(null); setReason(''); await invalidate();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      if (type === 'rebook') {
        const nextId = toRouteId(getRebookTargetId(response));
        setMessage('Đã tạo lại đơn từ đơn cũ.');
        if (nextId) router.push(routes.booking.detail(nextId));
        return;
      }
      setMessage('Đã cập nhật đơn hàng.');
    },
    onError: (error) => {
      setMessage(getApiErrorMessage(error, 'Không thể xử lý yêu cầu.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    },
  });

  const openChat = async () => {
    setMessage(''); setChatLoading(true);
    try {
      const response = await chatApi.getOrCreateConversation({ bookingId });
      const conversationId = toRouteId(getConversationId(response));
      if (!conversationId) throw new Error('Missing conversation id');
      router.push(routes.chatRoom(conversationId, booking?.provider?.fullName || 'Nhà cung cấp'));
    } catch (error) { setMessage(getApiErrorMessage(error, 'Không thể mở tin nhắn.')); }
    finally { setChatLoading(false); }
  };
  const exportReceipt = async () => {
    if (!booking) return;
    setMessage(''); setExportingPdf(true);
    try { await exportBookingReceiptPdf(booking); setMessage('Đã tạo biên nhận PDF.'); }
    catch { setMessage('Không thể xuất biên nhận PDF. Vui lòng thử lại sau.'); }
    finally { setExportingPdf(false); }
  };
  const confirmSheet = () => {
    if (sheet === 'accept') return actionMutation.mutate({ type: 'accept' });
    if (!reason.trim()) return setMessage('Vui lòng nhập lý do trước khi xác nhận.');
    actionMutation.mutate({ type: sheet === 'reject' ? 'reject' : 'cancel' });
  };

  if (!validBookingId) return <View style={styles.screen}><EmptyState icon="alert-circle-outline" title="Đơn hàng không hợp lệ" description="Vui lòng quay lại danh sách đơn hàng." actionLabel="Về đơn hàng" onAction={() => router.replace(routes.tabs.bookings)} /></View>;
  if (bookingQuery.isLoading) return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><DetailSkeleton /></ScrollView>;
  if (bookingQuery.isError || !booking) return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><InlineMessage tone="error" message="Không thể tải chi tiết đơn hàng." /><EmptyState icon="clipboard-alert-outline" title="Không tìm thấy đơn hàng" description="Đơn hàng có thể không tồn tại hoặc bạn không có quyền xem." actionLabel="Về đơn hàng" onAction={() => router.replace(routes.tabs.bookings)} /><Button mode="outlined" icon="refresh" onPress={() => bookingQuery.refetch()} style={styles.retry}>Thử lại</Button></ScrollView>;

  const status = booking.status || 'PENDING';
  const statusColor = getBookingStatusColor(status, colors);
  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" refreshControl={<RefreshControl refreshing={bookingQuery.isRefetching || timelineQuery.isRefetching} onRefresh={() => { bookingQuery.refetch(); timelineQuery.refetch(); }} />}>
      <CustomerBookingHeader booking={booking} statusColor={statusColor} />
      {message ? <InlineMessage tone={message.includes('Không') || message.includes('Vui lòng') ? 'error' : 'success'} message={message} /> : null}
      <CustomerProviderInfoCard booking={booking} statusColor={statusColor} />
      <CustomerBookingTimeline booking={booking} history={timelineQuery.data} />
      {booking.quoteAmount || booking.actualPrice || status === 'QUOTED' ? <CustomerQuotationCard booking={booking} loading={actionMutation.isPending} onConfirm={() => actionMutation.mutate({ type: 'confirm' })} onReject={() => setSheet('reject')} /> : null}
      <CustomerDisputeSection booking={booking} loading={actionMutation.isPending} chatLoading={chatLoading} exportLoading={exportingPdf} onCancel={() => setSheet('cancel')} onChat={openChat} onExport={exportReceipt} onTrack={() => router.push(routes.booking.track(String(bookingId)))} onReview={() => router.push(routes.booking.review(String(bookingId)))} onDispute={() => router.push(routes.booking.dispute(String(bookingId)))} onAccept={() => setSheet('accept')} onRebook={() => actionMutation.mutate({ type: 'rebook' })} />
    </ScrollView>
    {status === 'QUOTED' ? <BottomActionBar><Button mode="outlined" disabled={actionMutation.isPending} onPress={() => setSheet('reject')} style={styles.flexButton}>Từ chối</Button><Button mode="contained" loading={actionMutation.isPending} disabled={actionMutation.isPending} onPress={() => actionMutation.mutate({ type: 'confirm' })} style={styles.flexButton}>Chấp nhận giá</Button></BottomActionBar> : status === 'DONE' ? <BottomActionBar><Button mode="outlined" icon="star-outline" onPress={() => router.push(routes.booking.review(String(bookingId)))} style={styles.flexButton}>Đánh giá</Button><Button mode="contained" icon="check-circle-outline" loading={actionMutation.isPending} disabled={actionMutation.isPending} onPress={() => setSheet('accept')} style={styles.flexButton}>Hoàn thành</Button></BottomActionBar> : ['CONFIRMED', 'IN_PROGRESS'].includes(status) ? <BottomActionBar><Button mode="outlined" icon="map-marker-path" onPress={() => router.push(routes.booking.track(String(bookingId)))} style={styles.flexButton}>Theo dõi</Button><Button mode="contained" icon="chat-outline" loading={chatLoading} disabled={chatLoading} onPress={openChat} style={styles.flexButton}>Nhắn tin thợ</Button></BottomActionBar> : null}
    <ConfirmSheet visible={sheet !== null} title={sheet === 'accept' ? 'Xác nhận hoàn thành' : sheet === 'reject' ? 'Từ chối báo giá' : 'Hủy đơn hàng'} description={sheet === 'accept' ? 'Bạn xác nhận dịch vụ đã được thực hiện đúng thỏa thuận?' : 'Vui lòng nhập lý do để nhà cung cấp nắm được tình huống.'} confirmLabel={sheet === 'accept' ? 'Xác nhận' : sheet === 'reject' ? 'Từ chối' : 'Hủy đơn'} destructive={sheet !== 'accept'} loading={actionMutation.isPending} onDismiss={() => { setSheet(null); setReason(''); }} onConfirm={confirmSheet}>{sheet !== 'accept' ? <TextInput label="Lý do" mode="outlined" value={reason} onChangeText={setReason} multiline numberOfLines={4} autoFocus /> : null}</ConfirmSheet>
  </View>;
}

function DetailSkeleton() { const colors = useActiveColors(); return <View style={styles.skeleton}><View style={[styles.line, { width: '68%', backgroundColor: colors.surfaceVariant }]} /><View style={[styles.line, { width: '44%', backgroundColor: colors.surfaceVariant }]} /><View style={[styles.panel, { backgroundColor: colors.surfaceVariant }]} /><View style={[styles.panel, { backgroundColor: colors.surfaceVariant }]} /></View>; }
const styles = StyleSheet.create({ screen: { flex: 1 }, content: { padding: 16, paddingBottom: 120, gap: 16 }, retry: { alignSelf: 'center', borderRadius: 12 }, flexButton: { flex: 1, borderRadius: 12 }, skeleton: { gap: 12 }, line: { height: 18, borderRadius: 10 }, panel: { height: 140, borderRadius: 16 } });
