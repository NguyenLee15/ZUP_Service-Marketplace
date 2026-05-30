'use client';

import { useCallback, useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingsApi, reviewsApi } from '@/features/auth/services/api';
import { useAuthStore } from '@/store/auth.store';
import { BookingStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Star,
  MapPin,
  Clock,
  Phone,
  User,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  History,
  Sparkles,
  Zap,
  Timer,
  MessageCircle,
  Navigation,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BookingStepper } from '@/app/components/bookings/BookingStepper';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { BackButton } from '@/components/navigation/BackButton';
import { useNotificationsSocket } from '@/features/notification/hooks/useNotificationsSocket';

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Cancel/Dispute state
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const fetchBooking = useCallback(() => {
    if (!id) return;
    setLoading(true);
    bookingsApi
      .getById(Number(id))
      .then((res) => setBooking(res.data.data))
      .catch(() => router.push('/bookings'))
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleRealtimeBookingUpdate = useCallback(
    (notification: any) => {
      const bookingId = Number(
        notification?.referenceId || notification?.bookingId || 0,
      );
      if (bookingId === Number(id)) fetchBooking();
    },
    [fetchBooking, id],
  );

  useNotificationsSocket(handleRealtimeBookingUpdate);

  const handleAction = async (
    action: () => Promise<any>,
    successMsg: string,
  ) => {
    setActionLoading(true);
    try {
      await action();
      toast({ title: successMsg });

      if (successMsg === 'Đã nghiệm thu') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#006BFF', '#004EBA', '#476788'],
        });
      }

      fetchBooking();
    } catch (err: any) {
      toast({
        title: 'Lỗi',
        description: err.response?.data?.error?.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(p);
  const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN');

  // Auto-completion countdown
  const countdown = useMemo(() => {
    if (booking?.status !== BookingStatus.DONE || !booking?.completedAt) return null;
    const autoAt = booking.autoCompletedAt
      ? new Date(booking.autoCompletedAt).getTime()
      : new Date(booking.completedAt).getTime() + 24 * 60 * 60 * 1000;
    return autoAt;
  }, [booking?.status, booking?.completedAt, booking?.autoCompletedAt]);

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!countdown) return;
    const tick = () => {
      const diff = countdown - Date.now();
      if (diff <= 0) { setTimeLeft('Đã tự động nghiệm thu'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  if (loading)
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="h-96 glass-panel rounded-2xl animate-pulse" />
      </div>
    );
  if (!booking) return null;

  const isCustomer = user?.id === booking.customerId;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Back */}
      <BackButton fallbackHref="/bookings" />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md glass-panel text-[10px] font-bold text-action-blue uppercase tracking-wider">
                Mã đơn
              </span>
              <span className="text-sm text-foreground/60 font-mono">
                #{booking.bookingCode}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {booking.service?.name}
            </h1>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Stepper Timeline */}
        <div className="glass-panel glow-hover rounded-2xl p-2 overflow-hidden">
          <BookingStepper currentStatus={booking.status} />
        </div>

        {/* Auto-completion Countdown */}
        {booking.status === BookingStatus.DONE && !booking.autoCompletedAt && timeLeft && (
          <div className="glass-panel rounded-xl p-4 flex items-center gap-3 border-l-4 border-action-blue">
            <div className="w-10 h-10 rounded-full bg-action-blue/10 flex items-center justify-center">
              <Timer className="w-5 h-5 text-action-blue" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Tự động nghiệm thu sau
              </p>
              <p className="text-lg font-bold text-action-blue font-mono tracking-wider">
                {timeLeft}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Provider */}
      <Card className="glass-panel glow-hover rounded-2xl py-0 border-0">
        <CardContent className="p-5 flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-action-blue to-glacier-blue flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden shadow-[0_0_15px_rgba(0,107,255,0.3)]">
            {booking.provider?.avatarUrl ? (
              <img
                src={booking.provider.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              booking.provider?.fullName?.charAt(0) || '?'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              Người thực hiện dịch vụ
            </p>
            <h2 className="mt-1 text-base font-bold text-foreground truncate">
              {booking.provider?.fullName || 'Chưa có thông tin'}
            </h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                Nhà cung cấp phụ trách đơn hàng này
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {booking.provider?.phone || 'Chưa cập nhật số điện thoại'}
              </span>
            </div>
            {booking.provider && (
              <button
                onClick={() => {
                  if (booking.conversationId) {
                    router.push(`/chat?conversationId=${booking.conversationId}`);
                  } else {
                    router.push(`/chat?bookingId=${booking.id}`);
                  }
                }}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-action-blue/10 border border-action-blue/20 text-action-blue text-xs font-semibold hover:bg-action-blue/20 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Nhắn tin
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* History Accordion */}
      {booking.statusHistories?.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem
            value="history"
            className="border-none glass-panel rounded-2xl px-4"
          >
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <History className="w-4 h-4" />
                Lịch sử trạng thái chi tiết
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="relative pl-4 border-l-2 border-action-blue/30 space-y-6">
                {booking.statusHistories.map((h: any, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-card border-2 border-action-blue shadow-[0_0_6px_rgba(0,107,255,0.3)]" />
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-tight text-foreground">
                          {h.toStatus}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {formatDate(h.createdAt)}
                        </span>
                      </div>
                      {h.note && (
                        <p className="text-[11px] text-muted-foreground italic">
                          &quot;{h.note}&quot;
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Address */}
      <Card className="glass-panel glow-hover rounded-2xl border-0">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 text-action-blue" />
            <span>
              {booking.addressDetail}, {booking.ward}, {booking.district},{' '}
              {booking.province}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 text-action-blue" />
            <span>Mong muốn: {formatDate(booking.desiredTime)}</span>
          </div>
          {booking.surveyorName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4 text-action-blue" />
              <span>
                Người khảo sát: {booking.surveyorName} ({booking.surveyorPhone})
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chi tiết hạng mục yêu cầu đặt lịch */}
      {booking.bookingItems && booking.bookingItems.length > 0 && (
        <Card className="glass-panel glow-hover rounded-2xl border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-action-blue flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Chi tiết các hạng mục yêu cầu đặt lịch
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            <div className="rounded-xl border border-white/5 bg-white/5 overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-white/5 text-muted-foreground border-b border-white/10">
                    <th className="p-2.5 font-semibold">Tên hạng mục dịch vụ</th>
                    <th className="p-2.5 font-semibold text-center w-24">Số lượng</th>
                    <th className="p-2.5 font-semibold text-right w-24">Tạm tính</th>
                  </tr>
                </thead>
                <tbody>
                  {booking.bookingItems.map((item: any) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-2.5 text-foreground font-medium">{item.name}</td>
                      <td className="p-2.5 text-center text-foreground/80">{item.quantity} {item.unit}</td>
                      <td className="p-2.5 text-right text-foreground font-bold">
                        {formatPrice(Number(item.priceSnapshot) * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Báo giá và các hạng mục chi tiết sau khảo sát */}
      {booking.quotation && (
        <Card className="glass-panel rounded-2xl border-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-action-blue/10 via-transparent to-transparent pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-action-blue flex items-center gap-2 font-bold">
              <Zap className="w-4 h-4 text-cyan-300 fill-cyan-300/20" />
              Bảng báo giá thực tế sau khảo sát
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            {booking.quotation.quotationItems && booking.quotation.quotationItems.length > 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-white/10 text-slate-900 dark:text-white/80 border-b border-white/15">
                      <th className="p-2.5 font-semibold">Chi tiết hạng mục sửa chữa thực tế</th>
                      <th className="p-2.5 font-semibold text-center w-24">Số lượng</th>
                      <th className="p-2.5 font-semibold text-right w-24">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.quotation.quotationItems.map((item: any) => {
                      const originallyOrdered = booking.bookingItems?.some(
                        (bItem: any) => bItem.name.toLowerCase().trim() === item.name.toLowerCase().trim()
                      );
                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                            !originallyOrdered
                              ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-l-2 border-l-amber-500'
                              : ''
                          }`}
                        >
                          <td className="p-2.5 font-medium">
                            {item.name}
                            {!originallyOrdered && (
                              <span className="ml-1.5 inline-block text-[9px] px-1 py-0.2 bg-amber-500/20 rounded font-bold uppercase tracking-wider">
                                Phát sinh
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center">{item.quantity} {item.unit}</td>
                          <td className="p-2.5 text-right font-bold text-action-blue">
                            {formatPrice(Number(item.price) * item.quantity)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            <div className="space-y-2 mt-4 pt-2 border-t border-white/10">
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground text-xs">Tổng chi phí thực tế:</span>
                <span className="font-extrabold text-xl text-action-blue">
                  {formatPrice(Number(booking.quotation.actualPrice))}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-muted-foreground text-xs">Thời gian thực hiện dự kiến:</span>
                <span className="font-semibold text-xs text-foreground/90">{booking.quotation.estimatedTime}</span>
              </div>
            </div>

            {booking.quotation.note && (
              <div className="text-muted-foreground mt-2 text-xs bg-pale-gray/40 dark:bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="font-semibold text-foreground block mb-1">💬 Ghi chú từ thợ:</span>
                {booking.quotation.note}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review */}
      {booking.review && (
        <Card className="glass-panel rounded-2xl border-0">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Đánh giá của bạn</p>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < booking.review.rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.4)]' : 'text-platinum-tint'}`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2">{booking.review.rating}/5</span>
            </div>
            {booking.review.comment && (
              <p className="text-sm text-muted-foreground bg-pale-gray/30 p-3 rounded-lg">
                {booking.review.comment}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-2">
        {/* Customer: Confirm / Reject quote */}
        {isCustomer && booking.status === BookingStatus.QUOTED && (
          <div className="flex gap-2">
            <Button
              onClick={() =>
                handleAction(
                  () => bookingsApi.confirmQuote(booking.id),
                  'Đã chấp nhận báo giá',
                )
              }
              disabled={actionLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-1" /> Đồng ý báo giá
            </Button>
            <Button
              onClick={() => setShowCancel(true)}
              variant="outline"
              className="flex-1 border-red-200 text-red-600"
            >
              <XCircle className="w-4 h-4 mr-1" /> Từ chối
            </Button>
          </div>
        )}

        {/* Customer: Track provider (CONFIRMED / IN_PROGRESS) */}
        {isCustomer &&
          (booking.status === BookingStatus.CONFIRMED ||
            booking.status === BookingStatus.IN_PROGRESS) && (
            <Button
              onClick={() => router.push(`/bookings/${booking.id}/track`)}
              className="w-full bg-gradient-to-r from-action-blue to-glacier-blue hover:from-glacier-blue hover:to-action-blue text-white rounded-xl shadow-[0_0_15px_rgba(0,107,255,0.3)] py-5 font-bold text-sm transition-all hover:-translate-y-0.5"
            >
              <Navigation className="w-4 h-4 mr-2" /> Theo dõi lộ trình thợ
            </Button>
          )}

        {/* Customer: Post-Service UX (DONE) */}
        {isCustomer &&
          booking.status === BookingStatus.DONE &&
          !booking.review && (
            <div className="glass-panel flex flex-col gap-3 mt-8 p-6 rounded-2xl">
              <div className="text-center mb-2">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Công việc đã hoàn tất
                </h3>
                <p className="text-sm text-muted-foreground">
                  Bạn có hài lòng với dịch vụ không? Hãy chia sẻ trải nghiệm của
                  bạn.
                </p>
              </div>

              <Button
                onClick={() => {
                  if (!booking.autoCompletedAt) {
                    // Nếu chưa nghiệm thu, nghiệm thu trước rồi mở form đánh giá
                    handleAction(
                      () => bookingsApi.accept(booking.id),
                      'Đã nghiệm thu thành công',
                    ).then(() => setShowReview(true));
                  } else {
                    setShowReview(true);
                  }
                }}
                disabled={actionLoading}
                className="w-full bg-action-blue hover:bg-glacier-blue text-white rounded-xl shadow-[0_0_15px_rgba(0,107,255,0.3)] py-6 font-bold text-base transition-[background-color,box-shadow,transform] hover:-translate-y-0.5"
              >
                <Star className="w-5 h-5 mr-2 fill-white text-white" /> Đánh giá
                & Nghiệm thu
              </Button>

              <Button
                onClick={() => setShowCancel(true)}
                variant="ghost"
                className="w-full text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl"
              >
                <AlertTriangle className="w-4 h-4 mr-2" /> Có vấn đề? Mở khiếu
                nại
              </Button>
            </div>
          )}

        {/* Customer: Cancel (PENDING / QUOTED only) */}
        {isCustomer && [BookingStatus.PENDING].includes(booking.status) && (
          <Button
            onClick={() => setShowCancel(true)}
            variant="outline"
            className="w-full border-red-200 text-red-600"
          >
            Hủy đơn
          </Button>
        )}

        {/* Customer: Rebook (UC16.5) — for CANCELLED or completed bookings */}
        {isCustomer &&
          [BookingStatus.CANCELLED, BookingStatus.DONE].includes(
            booking.status,
          ) && (
            <Button
              onClick={() =>
                handleAction(
                  () => bookingsApi.rebook(booking.id),
                  'Đã đặt lại dịch vụ thành công!',
                )
              }
              disabled={actionLoading}
              variant="outline"
              className="w-full border-platinum-tint text-action-blue hover:bg-pale-gray"
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Đặt lại dịch vụ
            </Button>
          )}
      </div>

      {/* Cancel/Reject dialog */}
      {showCancel && (
        <Card className="glass-panel rounded-2xl border-red-500/20 border-l-4">
          <CardContent className="p-5 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-red-500/80">Xác nhận hành động</p>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Lý do..."
              rows={2}
              className="bg-card/50"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (booking.status === BookingStatus.QUOTED) {
                    handleAction(
                      () => bookingsApi.rejectQuote(booking.id, cancelReason),
                      'Đã từ chối báo giá',
                    );
                  } else if (booking.status === BookingStatus.DONE) {
                    const fd = new FormData();
                    fd.append('reason', cancelReason);
                    handleAction(
                      () => bookingsApi.dispute(booking.id, fd),
                      'Đã gửi khiếu nại',
                    );
                  } else {
                    handleAction(
                      () => bookingsApi.cancel(booking.id, cancelReason),
                      'Đã hủy đơn',
                    );
                  }
                  setShowCancel(false);
                }}
                disabled={!cancelReason || actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                size="sm"
              >
                Xác nhận
              </Button>
              <Button
                onClick={() => setShowCancel(false)}
                variant="outline"
                size="sm"
              >
                Đóng
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      {showReview && (
        <Card className="glass-panel rounded-2xl border-0">
          <CardContent className="p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-action-blue">Đánh giá dịch vụ</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star
                    className={`w-7 h-7 cursor-pointer transition-all ${s <= rating ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]' : 'text-platinum-tint hover:text-yellow-200'}`}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-action-blue" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-blue">
                  Gợi ý đánh giá
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Chuyên nghiệp',
                  'Nhanh chóng',
                  'Giá hợp lý',
                  'Thân thiện',
                  'Chất lượng cao',
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setComment((prev) => (prev ? `${prev}, ${tag}` : tag))
                    }
                    className="px-3 py-1.5 rounded-full glass-panel text-action-blue text-[10px] font-bold hover:bg-action-blue/10 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhận xét của bạn về chất lượng dịch vụ..."
                rows={3}
                className="pr-12 bg-card/50"
              />
              <button
                onClick={() => {
                  const suggestions = [
                    'Dịch vụ rất chuyên nghiệp, thợ đến đúng giờ và xử lý vấn đề rất nhanh gọn. Tôi rất hài lòng!',
                    'Giá cả hợp lý, thợ thân thiện và có tay nghề cao. Sẽ tiếp tục ủng hộ Zup.',
                    'Hỗ trợ nhiệt tình, quy trình làm việc minh bạch. Đánh giá 5 sao cho chất lượng!',
                  ];
                  setComment(
                    suggestions[Math.floor(Math.random() * suggestions.length)],
                  );
                  toast({
                    title: 'AI đã soạn thảo xong!',
                    description: 'Nội dung đã được tối ưu hóa cho bạn.',
                  });
                }}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-gradient-to-r from-action-blue to-glacier-blue text-white shadow-[0_0_10px_rgba(0,107,255,0.3)] hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                aria-label="Tự động soạn thảo nhận xét"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  handleAction(
                    () =>
                      reviewsApi.create({
                        bookingId: booking.id,
                        rating,
                        comment,
                      }),
                    'Đánh giá thành công!',
                  )
                }
                disabled={actionLoading}
                className="flex-1 bg-action-blue hover:bg-glacier-blue text-white shadow-[0_0_12px_rgba(0,107,255,0.25)]"
                size="sm"
              >
                Gửi đánh giá
              </Button>
              <Button
                onClick={() => setShowReview(false)}
                variant="outline"
                size="sm"
              >
                Đóng
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    PENDING: 'bg-yellow-100/80 text-yellow-700 shadow-[0_0_8px_rgba(234,179,8,0.15)]',
    QUOTED: 'bg-action-blue/10 text-action-blue shadow-[0_0_8px_rgba(0,107,255,0.15)]',
    CONFIRMED: 'bg-glacier-blue/10 text-glacier-blue shadow-[0_0_8px_rgba(0,78,186,0.15)]',
    IN_PROGRESS: 'bg-cyan-100/80 text-cyan-700 shadow-[0_0_8px_rgba(6,182,212,0.2)]',
    DONE: 'bg-green-100/80 text-green-700 shadow-[0_0_8px_rgba(22,163,74,0.15)]',
    DISPUTED: 'bg-red-100/80 text-red-700 shadow-[0_0_8px_rgba(220,38,38,0.15)]',
    CANCELLED: 'bg-pale-gray text-slate-blue',
  };
  const labels: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    QUOTED: 'Đã báo giá',
    CONFIRMED: 'Đã xác nhận',
    IN_PROGRESS: 'Đang thực hiện',
    DONE: 'Hoàn thành',
    DISPUTED: 'Khiếu nại',
    CANCELLED: 'Đã hủy',
  };
  return (
    <Badge className={`${configs[status] || configs.PENDING} border-0 text-xs font-bold px-3 py-1`}>
      {labels[status] || status}
    </Badge>
  );
}
