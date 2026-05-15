'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingsApi, reviewsApi } from '@/features/auth/services/api';
import { useAuthStore } from '@/store/auth.store';
import { BookingStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Star, MapPin, Clock, Phone, User, CheckCircle, AlertTriangle, XCircle, RefreshCw, History, Sparkles, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { BookingStepper } from '@/app/components/bookings/BookingStepper';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BackButton } from '@/components/navigation/BackButton';

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

  const fetchBooking = () => {
    if (!id) return;
    setLoading(true);
    bookingsApi.getById(Number(id))
      .then((res) => setBooking(res.data.data))
      .catch(() => router.push('/bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBooking(); }, [id]);

  const handleAction = async (action: () => Promise<any>, successMsg: string) => {
    setActionLoading(true);
    try {
      await action();
      toast({ title: successMsg });
      
      if (successMsg === 'Đã nghiệm thu') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#006BFF', '#004EBA', '#476788']
        });
      }
      
      fetchBooking();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN');

  if (loading) return <div className="max-w-2xl mx-auto p-6"><div className="h-96 bg-muted rounded-xl animate-pulse" /></div>;
  if (!booking) return null;

  const isCustomer = user?.id === booking.customerId;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Back */}
      <BackButton fallbackHref="/bookings" />

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-bold text-muted-foreground uppercase">Mã đơn</span>
              <span className="text-sm text-foreground/60 font-mono">#{booking.bookingCode}</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{booking.service?.name}</h1>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {/* Stepper Timeline */}
        <div className="surface-card rounded-[20px] p-2 overflow-hidden">
          <BookingStepper currentStatus={booking.status} />
        </div>
      </div>

      {/* Provider */}
      <Card className="surface-card rounded-[20px] py-0">
        <CardContent className="p-4 flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-action-blue flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden">
            {booking.provider?.avatarUrl ? (
              <img src={booking.provider.avatarUrl} alt="" className="w-full h-full object-cover" />
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
          </div>
        </CardContent>
      </Card>

      {/* History Accordion */}
      {booking.statusHistories?.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="history" className="border-none bg-muted/30 rounded-2xl px-4">
            <AccordionTrigger className="hover:no-underline py-4">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                <History className="w-4 h-4" />
                Lịch sử trạng thái chi tiết
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-4">
              <div className="relative pl-4 border-l-2 border-platinum-tint space-y-6">
                {booking.statusHistories.map((h: any, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[25px] top-1 w-4 h-4 rounded-full bg-white border-2 border-action-blue" />
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-tight text-foreground">{h.toStatus}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{formatDate(h.createdAt)}</span>
                      </div>
                      {h.note && <p className="text-[11px] text-muted-foreground italic">&quot;{h.note}&quot;</p>}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {/* Address */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{booking.addressDetail}, {booking.ward}, {booking.district}, {booking.province}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Mong muốn: {formatDate(booking.desiredTime)}</span>
          </div>
          {booking.surveyorName && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Người khảo sát: {booking.surveyorName} ({booking.surveyorPhone})</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotation */}
      {booking.quotation && (
        <Card className="border-platinum-tint bg-pale-gray/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-action-blue">Báo giá</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Giá thực tế</span>
              <span className="font-bold text-action-blue">{formatPrice(Number(booking.quotation.actualPrice))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Thời gian dự kiến</span>
              <span>{booking.quotation.estimatedTime}</span>
            </div>
            {booking.quotation.note && <p className="text-muted-foreground mt-1">Ghi chú: {booking.quotation.note}</p>}
          </CardContent>
        </Card>
      )}

      {/* Review */}
      {booking.review && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < booking.review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-platinum-tint'}`} />
              ))}
            </div>
            {booking.review.comment && <p className="text-sm text-muted-foreground">{booking.review.comment}</p>}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-2 pt-2">
        {/* Customer: Confirm / Reject quote */}
        {isCustomer && booking.status === BookingStatus.QUOTED && (
          <div className="flex gap-2">
            <Button onClick={() => handleAction(() => bookingsApi.confirmQuote(booking.id), 'Đã chấp nhận báo giá')}
              disabled={actionLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
              <CheckCircle className="w-4 h-4 mr-1" /> Đồng ý báo giá
            </Button>
            <Button onClick={() => setShowCancel(true)} variant="outline" className="flex-1 border-red-200 text-red-600">
              <XCircle className="w-4 h-4 mr-1" /> Từ chối
            </Button>
          </div>
        )}

        {/* Customer: Post-Service UX (DONE) */}
        {isCustomer && booking.status === BookingStatus.DONE && !booking.review && (
          <div className="surface-card flex flex-col gap-3 mt-8 p-6 rounded-[20px]">
            <div className="text-center mb-2">
              <h3 className="text-xl font-bold text-foreground mb-2">Công việc đã hoàn tất</h3>
              <p className="text-sm text-muted-foreground">Bạn có hài lòng với dịch vụ không? Hãy chia sẻ trải nghiệm của bạn.</p>
            </div>
            
            <Button 
              onClick={() => {
                if (!booking.autoCompletedAt) {
                  // Nếu chưa nghiệm thu, nghiệm thu trước rồi mở form đánh giá
                  handleAction(() => bookingsApi.accept(booking.id), 'Đã nghiệm thu thành công').then(() => setShowReview(true));
                } else {
                  setShowReview(true);
                }
              }} 
              disabled={actionLoading} 
              className="w-full bg-action-blue hover:bg-glacier-blue text-white rounded-xl shadow-[var(--brand-shadow-button)] py-6 font-bold text-base transition-[background-color,box-shadow,transform] hover:-translate-y-0.5"
            >
              <Star className="w-5 h-5 mr-2 fill-white text-white" /> Đánh giá & Nghiệm thu
            </Button>
            
            <Button 
              onClick={() => setShowCancel(true)} 
              variant="ghost" 
              className="w-full text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl"
            >
              <AlertTriangle className="w-4 h-4 mr-2" /> Có vấn đề? Mở khiếu nại
            </Button>
          </div>
        )}

        {/* Customer: Cancel (PENDING / QUOTED only) */}
        {isCustomer && [BookingStatus.PENDING].includes(booking.status) && (
          <Button onClick={() => setShowCancel(true)} variant="outline" className="w-full border-red-200 text-red-600">
            Hủy đơn
          </Button>
        )}

        {/* Customer: Rebook (UC16.5) — for CANCELLED or completed bookings */}
        {isCustomer && [BookingStatus.CANCELLED, BookingStatus.DONE].includes(booking.status) && (
          <Button onClick={() => handleAction(
            () => bookingsApi.rebook(booking.id),
            'Đã đặt lại dịch vụ thành công!'
          )} disabled={actionLoading} variant="outline" className="w-full border-platinum-tint text-action-blue hover:bg-pale-gray">
            <RefreshCw className="w-4 h-4 mr-1" /> Đặt lại dịch vụ
          </Button>
        )}
      </div>

      {/* Cancel/Reject dialog */}
      {showCancel && (
        <Card className="border-red-200">
          <CardContent className="p-4 space-y-3">
            <Textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Lý do..." rows={2} />
            <div className="flex gap-2">
              <Button onClick={() => {
                if (booking.status === BookingStatus.QUOTED) {
                  handleAction(() => bookingsApi.rejectQuote(booking.id, cancelReason), 'Đã từ chối báo giá');
                } else if (booking.status === BookingStatus.DONE) {
                  const fd = new FormData();
                  fd.append('reason', cancelReason);
                  handleAction(() => bookingsApi.dispute(booking.id, fd), 'Đã gửi khiếu nại');
                } else {
                  handleAction(() => bookingsApi.cancel(booking.id, cancelReason), 'Đã hủy đơn');
                }
                setShowCancel(false);
              }} disabled={!cancelReason || actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white" size="sm">
                Xác nhận
              </Button>
              <Button onClick={() => setShowCancel(false)} variant="outline" size="sm">Đóng</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      {showReview && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)}>
                  <Star className={`w-6 h-6 cursor-pointer transition-colors ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-platinum-tint'}`} />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-action-blue" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-blue">Gợi ý đánh giá</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Chuyên nghiệp', 'Nhanh chóng', 'Giá hợp lý', 'Thân thiện', 'Chất lượng cao'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setComment(prev => prev ? `${prev}, ${tag}` : tag)}
                    className="px-3 py-1 rounded-full bg-pale-gray text-action-blue text-[10px] font-bold border border-platinum-tint hover:bg-platinum-tint/70 transition-colors"
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
                className="pr-12"
              />
              <button
                onClick={() => {
                  const suggestions = [
                    "Dịch vụ rất chuyên nghiệp, thợ đến đúng giờ và xử lý vấn đề rất nhanh gọn. Tôi rất hài lòng!",
                    "Giá cả hợp lý, thợ thân thiện và có tay nghề cao. Sẽ tiếp tục ủng hộ HomeService.",
                    "Hỗ trợ nhiệt tình, quy trình làm việc minh bạch. Đánh giá 5 sao cho chất lượng!"
                  ];
                  setComment(suggestions[Math.floor(Math.random() * suggestions.length)]);
                  toast({ title: 'AI đã soạn thảo xong!', description: 'Nội dung đã được tối ưu hóa cho bạn.' });
                }}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-action-blue text-white shadow-[var(--brand-shadow-sm)] hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                aria-label="Tự động soạn thảo nhận xét"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleAction(
                () => reviewsApi.create({ bookingId: booking.id, rating, comment }),
                'Đánh giá thành công!'
              )} disabled={actionLoading} className="flex-1 bg-action-blue hover:bg-glacier-blue text-white" size="sm">
                Gửi đánh giá
              </Button>
              <Button onClick={() => setShowReview(false)} variant="outline" size="sm">Đóng</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    QUOTED: 'bg-pale-gray text-action-blue',
    CONFIRMED: 'bg-pale-gray text-glacier-blue',
    IN_PROGRESS: 'bg-pale-gray text-midnight-indigo',
    DONE: 'bg-green-100 text-green-700',
    DISPUTED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-pale-gray text-slate-blue',
  };
  const labels: Record<string, string> = {
    PENDING: 'Chờ xử lý', QUOTED: 'Đã báo giá', CONFIRMED: 'Đã xác nhận',
    IN_PROGRESS: 'Đang thực hiện', DONE: 'Hoàn thành', DISPUTED: 'Khiếu nại', CANCELLED: 'Đã hủy',
  };
  return <Badge className={`${configs[status] || configs.PENDING} border-0 text-xs`}>{labels[status] || status}</Badge>;
}
