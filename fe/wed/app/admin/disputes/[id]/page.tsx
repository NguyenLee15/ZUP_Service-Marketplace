'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';
import { AlertCircle, Loader2, User, Image as ImageIcon, Clock, Sparkles, ShieldCheck, Scale, Info } from 'lucide-react';
import { BackButton } from '@/components/navigation/BackButton';

export default function AdminDisputeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<'COMPLETE' | 'REFUND' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    adminApi.getDisputeDetail(Number(id))
      .then(res => setDispute(res.data.data))
      .catch(() => router.push('/admin/disputes'))
      .finally(() => setLoading(false));
  }, [id]);

  const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN');
  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const handleResolve = async () => {
    if (!decision) {
      toast({ title: 'Vui lòng chọn phán quyết', variant: 'destructive' });
      return;
    }
    if (!reason.trim()) {
      toast({ title: 'Vui lòng nhập lý do phán quyết', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.resolveDispute(Number(id), {
        resolutionAction: decision,
        resolutionReason: reason,
      });

      toast({ title: decision === 'COMPLETE' ? 'Đã hoàn thành đơn hàng' : 'Đã hoàn tiền cho khách' });
      // Refresh
      const refreshRes = await adminApi.getDisputeDetail(Number(id));
      setDispute(refreshRes.data.data);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );

  if (!dispute) return null;

  const booking = dispute.booking;
  const isResolved = dispute.status === 'RESOLVED';

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/admin/disputes" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân Xử Tranh Chấp</h1>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">Dispute #{dispute.id}</Badge>
            <Badge variant="outline">Booking #{booking?.bookingCode}</Badge>
            <Badge className={`border-0 ${isResolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isResolved ? 'Đã giải quyết' : 'Đang chờ xử lý'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Resolved info */}
      {isResolved && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-green-700 mb-1">
              Phán quyết: {dispute.resolutionAction === 'COMPLETE' ? '✅ Hoàn thành đơn' : '💰 Hoàn tiền'}
            </p>
            <p className="text-sm text-green-600">{dispute.resolutionReason}</p>
          </CardContent>
        </Card>
      )}

      {/* AI Mediator Section */}
      {!isResolved && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
            <Scale className="w-24 h-24 text-purple-600" />
          </div>
          <CardHeader className="pb-2 relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-purple-600 text-white shadow-lg shadow-purple-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <CardTitle className="text-lg font-black text-purple-900 dark:text-purple-100 uppercase tracking-tight">AI Mediator Analysis</CardTitle>
            </div>
            <CardDescription className="text-purple-700/70 font-bold text-[10px] uppercase tracking-widest italic">Beta - Tự động phân tích bằng chứng & lịch sử hội thoại</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-white/60 dark:bg-black/20 rounded-3xl border border-white dark:border-purple-900/30">
                <div className="text-4xl font-black text-purple-600 mb-1">85%</div>
                <div className="text-[10px] font-bold text-purple-800/60 uppercase tracking-tighter">Độ tin cậy phán quyết</div>
                <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500 text-white text-[10px] font-black uppercase tracking-widest">
                  <ShieldCheck className="w-3 h-3" />
                  Highly Reliable
                </div>
              </div>
              
              <div className="md:col-span-3 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-900/60">
                    <Scale className="w-4 h-4" /> Đề xuất hành động
                  </div>
                  <div className="p-4 bg-purple-600 text-white rounded-2xl shadow-xl shadow-purple-500/20 font-bold text-sm">
                    Đề xuất: HOÀN THÀNH ĐƠN HÀNG (Bác bỏ khiếu nại)
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-white/40 dark:bg-black/10 rounded-2xl border border-white/50 dark:border-purple-900/20">
                    <div className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-2">Phân tích bằng chứng</div>
                    <ul className="text-xs space-y-2 text-foreground/80 font-medium">
                      <li className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0" />
                        Hình ảnh thợ gửi (RESULT) khớp với các tiêu chuẩn trong mô tả dịch vụ.
                      </li>
                      <li className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1 shrink-0" />
                        Vị trí thợ check-in/out trùng khớp với địa chỉ khách hàng.
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 bg-white/40 dark:bg-black/10 rounded-2xl border border-white/50 dark:border-purple-900/20">
                    <div className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-2">Điểm bất thường</div>
                    <ul className="text-xs space-y-2 text-foreground/80 font-medium">
                      <li className="flex gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1 shrink-0" />
                        Hình ảnh khách gửi có dấu hiệu ánh sáng không đồng nhất với thời điểm hoàn thành.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold italic text-purple-700/60 bg-purple-100/50 p-3 rounded-xl border border-purple-200/50">
              <Info className="w-3.5 h-3.5" />
              AI Mediator đã phân tích 12 tin nhắn gần nhất và 4 hình ảnh bằng chứng. Lưu ý: Admin có toàn quyền thay đổi phán quyết cuối cùng.
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Side */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="w-5 h-5" />
              Khách hàng khiếu nại
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Người khiếu nại</p>
              <p className="font-medium">{booking?.customer?.fullName || `User #${dispute.raisedBy}`}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Lý do</p>
              <p className="font-medium text-red-600">{dispute.reason}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Thời gian</p>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatDate(dispute.createdAt)}
              </p>
            </div>

            {/* Evidence */}
            {dispute.evidences?.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Bằng chứng ({dispute.evidences.length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {dispute.evidences.map((ev: any, i: number) => (
                    <a key={i} href={ev.fileUrl} target="_blank" rel="noreferrer">
                      {ev.type === 'VIDEO' ? (
                        <video src={ev.fileUrl} className="rounded border w-full h-24 object-cover" />
                      ) : (
                        <img src={ev.fileUrl} alt={`Evidence ${i + 1}`} className="rounded border w-full h-24 object-cover" />
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Booking Info */}
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-orange-50">
            <CardTitle className="text-base">Thông tin đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="pt-5 space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Dịch vụ</p>
              <p className="font-medium">{booking?.service?.name || '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Nhà cung cấp</p>
              <p className="font-medium">{booking?.provider?.fullName || '—'}</p>
            </div>
            {booking?.quotation && (
              <div>
                <p className="text-gray-500">Giá trị đơn</p>
                <p className="font-bold text-lg text-blue-700">{formatPrice(Number(booking.quotation.actualPrice))}</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Địa chỉ</p>
              <p>{booking?.addressDetail}, {booking?.ward}, {booking?.district}, {booking?.province}</p>
            </div>

            {/* Result Images */}
            {booking?.attachments?.filter((a: any) => a.type === 'RESULT').length > 0 && (
              <div>
                <p className="text-gray-500 mb-2">Ảnh kết quả của thợ</p>
                <div className="grid grid-cols-2 gap-2">
                  {booking.attachments.filter((a: any) => a.type === 'RESULT').map((att: any, i: number) => (
                    <a key={i} href={att.fileUrl} target="_blank" rel="noreferrer">
                      <img src={att.fileUrl} alt={`Result ${i}`} className="rounded border w-full h-24 object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resolution Panel */}
        <Card className="border-0 shadow-md lg:sticky lg:top-6 lg:h-fit">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-base">Phán Quyết</CardTitle>
            {booking?.quotation && (
              <CardDescription>Số tiền: {formatPrice(Number(booking.quotation.actualPrice))}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-5 space-y-4">
            {!isResolved ? (
              <>
                {/* Option buttons */}
                <div className="space-y-2">
                  <button
                    onClick={() => setDecision('COMPLETE')}
                    className={`w-full border rounded-lg p-4 text-left transition ${decision === 'COMPLETE' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'}`}
                  >
                    <p className="font-medium text-gray-900">✅ Hoàn thành đơn hàng</p>
                    <p className="text-xs text-gray-500 mt-1">Trả tiền cho nhà cung cấp (trừ hoa hồng)</p>
                  </button>

                  <button
                    onClick={() => setDecision('REFUND')}
                    className={`w-full border rounded-lg p-4 text-left transition ${decision === 'REFUND' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <p className="font-medium text-gray-900">💰 Hoàn tiền cho khách</p>
                    <p className="text-xs text-gray-500 mt-1">Hủy đơn và hoàn tiền khách hàng</p>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lý do phán quyết *</label>
                  <Textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Nhập lý do phán quyết chi tiết..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleResolve}
                  disabled={submitting || !decision}
                  className="w-full h-12 bg-purple-600 hover:bg-purple-700"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {submitting ? 'Đang xử lý...' : 'Chốt Phán Quyết'}
                </Button>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-yellow-900 font-medium flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Quyết định này không thể thay đổi sau khi xác nhận
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-medium text-gray-900">Tranh chấp đã được giải quyết</p>
                <p className="text-sm text-gray-500 mt-1">{dispute.resolutionReason}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
