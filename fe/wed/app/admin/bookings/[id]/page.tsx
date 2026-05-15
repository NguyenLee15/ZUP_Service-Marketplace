'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/features/auth/services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock, User, Phone, Star, Mail } from 'lucide-react';
import { BackButton } from '@/components/navigation/BackButton';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700' },
  QUOTED: { label: 'Đã báo giá', color: 'bg-blue-100 text-blue-700' },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-indigo-100 text-indigo-700' },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'bg-purple-100 text-purple-700' },
  DONE: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700' },
  DISPUTED: { label: 'Khiếu nại', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-500' },
};

export default function AdminBookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    adminApi.getBookingDetail(Number(id))
      .then((res) => setBooking(res.data.data))
      .catch(() => router.push('/admin/bookings'))
      .finally(() => setLoading(false));
  }, [id]);

  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);
  const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN');

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
      <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
      <div className="h-60 bg-gray-100 rounded-xl animate-pulse" />
    </div>
  );
  if (!booking) return null;

  const st = STATUS_MAP[booking.status] || STATUS_MAP.PENDING;

  return (
    <div className="space-y-6">
      <BackButton fallbackHref="/admin/bookings" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm text-gray-400 font-mono">#{booking.bookingCode}</span>
          <h1 className="text-2xl font-bold text-gray-900">{booking.service?.name}</h1>
          <p className="text-sm text-gray-500">{booking.service?.category?.name}</p>
        </div>
        <Badge className={`${st.color} border-0 text-sm`}>{st.label}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Khách hàng</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="font-medium">{booking.customer?.fullName}</span></div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span>{booking.customer?.email}</span></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{booking.customer?.phone || '—'}</span></div>
          </CardContent>
        </Card>

        {/* Provider */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Nhà cung cấp</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /><span className="font-medium">{booking.provider?.fullName}</span></div>
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span>{booking.provider?.email}</span></div>
            <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{booking.provider?.phone || '—'}</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Address */}
      <Card>
        <CardContent className="p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{booking.addressDetail}, {booking.ward}, {booking.district}, {booking.province}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Mong muốn: {formatDate(booking.desiredTime)}</span>
          </div>
          {booking.surveyorName && (
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span>Người khảo sát: {booking.surveyorName} ({booking.surveyorPhone})</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quotation */}
      {booking.quotation && (
        <Card className="border-blue-100 bg-blue-50/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-700">Báo giá</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Giá thực tế</span>
              <span className="font-bold text-blue-700">{formatPrice(Number(booking.quotation.actualPrice))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Thời gian dự kiến</span>
              <span>{booking.quotation.estimatedTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Hoa hồng snapshot</span>
              <span>{booking.quotation.commissionRateSnapshot}%</span>
            </div>
            {booking.quotation.note && <p className="text-gray-500 mt-1">Ghi chú: {booking.quotation.note}</p>}
          </CardContent>
        </Card>
      )}

      {/* Dispute */}
      {booking.dispute && (
        <Card className="border-red-100 bg-red-50/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-red-700">Khiếu nại</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Lý do:</strong> {booking.dispute.reason}</p>
            <p><strong>Trạng thái:</strong> {booking.dispute.status}</p>
            {booking.dispute.resolutionReason && (
              <p><strong>Giải quyết:</strong> {booking.dispute.resolutionReason}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review */}
      {booking.review && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Đánh giá</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < booking.review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
              ))}
            </div>
            {booking.review.comment && <p className="text-sm text-gray-600">{booking.review.comment}</p>}
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      {booking.statusHistories?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Lịch sử trạng thái</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {booking.statusHistories.map((h: any, i: number) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium">{STATUS_MAP[h.toStatus]?.label || h.toStatus}</span>
                  {h.note && <span className="text-gray-400"> — {h.note}</span>}
                  <p className="text-xs text-gray-400">{formatDate(h.createdAt)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
