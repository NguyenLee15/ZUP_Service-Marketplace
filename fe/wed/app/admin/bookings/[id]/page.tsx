'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/features/auth/services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { 
  MapPin, Clock, User, Phone, Star, Mail, ArrowLeft, 
  FileText, ShieldAlert, CheckCircle, ShieldCheck, 
  AlertTriangle, Loader2, XCircle
} from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  QUOTED: { label: 'Đã báo giá', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  DONE: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700 border-green-200' },
  DISPUTED: { label: 'Khiếu nại', color: 'bg-red-100 text-red-700 border-red-200' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export default function AdminBookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookingDetail = () => {
    if (!id) return;
    setLoading(true);
    adminApi.getBookingDetail(Number(id))
      .then((res) => setBooking(res.data.data))
      .catch(() => router.push('/admin/bookings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [id]);

  const formatPrice = (p: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
    
  const formatDate = (d: string) => 
    new Date(d).toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    });

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast({ title: 'Vui lòng nhập lý do hủy đơn', variant: 'destructive' });
      return;
    }
    setActionLoading(true);
    try {
      await adminApi.cancelBooking(Number(id), cancelReason);
      toast({ title: 'Đã hủy đơn hàng thành công' });
      setShowCancelModal(false);
      setCancelReason('');
      fetchBookingDetail();
    } catch (err: any) {
      toast({ 
        title: 'Lỗi', 
        description: err.response?.data?.error?.message || err.message, 
        variant: 'destructive' 
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse" />
      <div className="h-24 bg-slate-100 rounded-2xl animate-pulse border" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-48 bg-slate-100 rounded-2xl animate-pulse border" />
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse border" />
        </div>
        <div className="h-96 bg-slate-100 rounded-2xl animate-pulse border" />
      </div>
    </div>
  );

  if (!booking) return null;

  const st = STATUS_MAP[booking.status] || { label: booking.status, color: 'bg-slate-100 text-slate-700 border-slate-200' };
  const canCancel = booking.status === 'PENDING' || booking.status === 'QUOTED';

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      {/* Header & Back Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/bookings')}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Chi Tiết Đơn Hàng</h1>
              <Badge className={`${st.color} border text-xs font-bold px-2.5 py-0.5`}>
                {st.label}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">Mã đơn: #{booking.bookingCode}</p>
          </div>
        </div>

        {canCancel && (
          <Button
            variant="destructive"
            onClick={() => setShowCancelModal(true)}
            className="rounded-xl shadow-sm text-xs font-bold gap-1.5 h-10 px-4"
          >
            <XCircle className="w-4 h-4" /> Hủy Đơn Hàng
          </Button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Main Info, Quotation, Dispute, Review) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Service detail card */}
          <Card className="border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" /> Dịch vụ yêu cầu
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{booking.service?.name}</h3>
                <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full mt-1.5 inline-block">
                  {booking.service?.category?.name}
                </span>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mô tả công việc</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{booking.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>Thời gian mong muốn: <strong>{formatDate(booking.desiredTime)}</strong></span>
                </div>
                {booking.surveyorName && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Thợ khảo sát: <strong>{booking.surveyorName}</strong> ({booking.surveyorPhone})</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quotation Details */}
          {booking.quotation && (
            <Card className="border-blue-100 bg-gradient-to-br from-blue-50/20 to-indigo-50/10 rounded-2xl shadow-sm">
              <CardHeader className="pb-3 border-b border-blue-100/50">
                <CardTitle className="text-sm font-bold text-blue-700">Chi tiết báo giá thợ gửi</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-sm">
                <div className="flex justify-between items-center bg-white/70 p-3 rounded-xl border border-blue-100/30">
                  <span className="text-slate-500 font-medium">Giá thực tế của đơn</span>
                  <span className="font-black text-xl text-blue-700">
                    {formatPrice(Number(booking.quotation.actualPrice))}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/50 p-3 rounded-xl border border-blue-100/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thời gian thi công</span>
                    <span className="font-semibold text-slate-700 mt-1 block">{booking.quotation.estimatedTime}</span>
                  </div>
                  <div className="bg-white/50 p-3 rounded-xl border border-blue-100/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tỷ lệ hoa hồng (Snapshot)</span>
                    <span className="font-semibold text-amber-600 mt-1 block">{booking.quotation.commissionRateSnapshot}%</span>
                  </div>
                </div>

                {booking.quotation.note && (
                  <div className="bg-white/50 p-3 rounded-xl border border-blue-100/20">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú từ thợ</span>
                    <p className="text-xs text-slate-600 leading-relaxed">{booking.quotation.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dispute details if present */}
          {booking.dispute && (
            <Card className="border-red-100 bg-red-50/10 rounded-2xl shadow-sm">
              <CardHeader className="pb-3 border-b border-red-100/40">
                <CardTitle className="text-sm font-bold text-rose-700 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" /> Tranh chấp khiếu nại đang mở
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-sm">
                <div className="bg-white p-3 rounded-xl border border-red-100/30">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lý do khiếu nại</span>
                  <p className="text-sm font-medium text-slate-800 mt-1 leading-relaxed">{booking.dispute.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-red-100/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Trạng thái tranh chấp</span>
                    <Badge className="mt-1 border-0 bg-red-100 text-red-700 font-bold text-[10px] px-2 py-0.5">
                      {booking.dispute.status}
                    </Badge>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-red-100/30">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Thời điểm tạo</span>
                    <span className="font-semibold text-slate-700 mt-1 block">{formatDate(booking.dispute.createdAt)}</span>
                  </div>
                </div>

                {booking.dispute.resolutionReason && (
                  <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Phán quyết từ quản trị</span>
                    <p className="text-xs text-emerald-700 mt-1 leading-relaxed">{booking.dispute.resolutionReason}</p>
                    {booking.dispute.resolutionAction && (
                      <Badge className="mt-2 border-0 bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {booking.dispute.resolutionAction === 'COMPLETE' ? 'Hoàn thành' : 'Phạt thợ'}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Customer Reviews */}
          {booking.review && (
            <Card className="border-slate-200/80 rounded-2xl shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">Đánh giá dịch vụ</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < booking.review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} 
                    />
                  ))}
                  <span className="font-bold text-slate-700 ml-1.5 text-sm">
                    {booking.review.rating} / 5
                  </span>
                </div>
                {booking.review.comment && (
                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed italic">
                      &ldquo;{booking.review.comment}&rdquo;
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (Parties Info, Address, Timeline) */}
        <div className="space-y-6">
          
          {/* Parties involved */}
          <Card className="border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm font-bold text-slate-800">Đối tác giao dịch</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-sm">
              {/* Customer */}
              <div className="space-y-2.5 pb-4 border-b border-slate-100">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                  Khách hàng
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
                    {booking.customer?.fullName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 leading-none">{booking.customer?.fullName}</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {booking.customer?.email}
                    </p>
                    {booking.customer?.phone && (
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {booking.customer?.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Provider */}
              <div className="space-y-2.5 pt-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md inline-block">
                  Thợ / Nhà cung cấp
                </span>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-700">
                    {booking.provider?.fullName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 leading-none">{booking.provider?.fullName}</p>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {booking.provider?.email}
                    </p>
                    {booking.provider?.phone && (
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" /> {booking.provider?.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address details */}
          <Card className="border-slate-200/80 rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800">Địa chỉ thi công</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 text-sm space-y-2 leading-relaxed">
              <div className="flex items-start gap-2 text-slate-700">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  {[booking.addressDetail, booking.ward, booking.district, booking.province]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          {booking.statusHistories?.length > 0 && (
            <Card className="border-slate-200/80 rounded-2xl shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-bold text-slate-800">Lịch sử tiến độ</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                  {booking.statusHistories.map((h: any, i: number) => {
                    const stepStatus = STATUS_MAP[h.toStatus] || { label: h.toStatus, color: 'bg-slate-100 text-slate-700 border-slate-200' };
                    return (
                      <div key={i} className="relative group transition-all duration-200">
                        {/* Circle marker */}
                        <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-4 border-white shadow-sm flex items-center justify-center transition-transform group-hover:scale-110 ${
                          h.toStatus === 'DONE' ? 'bg-emerald-500' :
                          h.toStatus === 'DISPUTED' ? 'bg-rose-500' :
                          h.toStatus === 'CANCELLED' ? 'bg-slate-400' : 'bg-blue-500'
                        }`} />
                        
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${stepStatus.color}`}>
                              {stepStatus.label}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {formatDate(h.createdAt)}
                            </span>
                          </div>
                          {h.note && (
                            <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 leading-normal">
                              {h.note}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md border-slate-200 rounded-2xl shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" /> Hủy đơn hàng này?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Hành động này sẽ hủy bỏ đơn hàng và thay đổi trạng thái thành <span className="font-bold">CANCELLED</span>.
                Khách hàng và nhà cung cấp sẽ nhận được thông báo.
              </p>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Lý do hủy đơn *
                </label>
                <Textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết để thông báo cho các bên..."
                  rows={3}
                  className="resize-none border-slate-200 focus:border-red-400 focus:ring-red-400/20 text-sm rounded-lg"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  className="rounded-xl text-xs font-bold border-slate-200 h-10"
                >
                  Đóng
                </Button>
                <Button
                  onClick={handleCancelBooking}
                  disabled={actionLoading || !cancelReason.trim()}
                  className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 rounded-xl text-xs font-bold h-10"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Hủy Đơn Hàng'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
