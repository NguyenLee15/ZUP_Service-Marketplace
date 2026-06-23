'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Clock, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight as ChevronRightIcon, User } from 'lucide-react';
import { bookingsApi } from '@/features/auth/services/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Booking } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: ApiPayload }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  ACCEPTED: { label: 'Đã tiếp nhận', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  QUOTED: { label: 'Đã báo giá', color: 'bg-pale-gray text-action-blue', icon: Package },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-pale-gray text-glacier-blue', icon: CheckCircle },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'bg-pale-gray text-midnight-indigo', icon: Clock },
  DONE: { label: 'Hoàn thành', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  DISPUTED: { label: 'Khiếu nại', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-muted text-muted-foreground', icon: XCircle },
};

const PAGE_SIZE = 10;

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    setLoading(true);
    const params: ApiPayload = { page, limit: PAGE_SIZE };
    if (status) params.status = status;
    bookingsApi.getMyBookings(params)
      .then((res) => {
        setBookings(res.data.data || []);
        if (res.data.meta) setMeta(res.data.meta);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, page]);

  // Reset page khi đổi tab status
  useEffect(() => { setPage(1); }, [status]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Đơn hàng của tôi</h1>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="w-full justify-start overflow-x-auto mb-4 bg-muted p-1 rounded-lg">
          <TabsTrigger value="" className="text-xs">Tất cả</TabsTrigger>
          <TabsTrigger value="PENDING" className="text-xs">Chờ xử lý</TabsTrigger>
          <TabsTrigger value="ACCEPTED" className="text-xs">Đã tiếp nhận</TabsTrigger>
          <TabsTrigger value="QUOTED" className="text-xs">Đã báo giá</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS" className="text-xs">Đang thực hiện</TabsTrigger>
          <TabsTrigger value="DONE" className="text-xs">Hoàn thành</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-3">
           {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass-panel text-center py-20 px-4 rounded-[20px] mt-8 text-white shadow-xl animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/5 border border-white/10 rounded-full flex items-center justify-center shadow-md">
            <Package className="w-10 h-10 text-action-blue" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Bạn chưa có đơn hàng nào</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mb-8 leading-relaxed">
            Hàng ngàn chuyên gia đang sẵn sàng giúp đỡ bạn. Đặt dịch vụ đầu tiên ngay hôm nay.
          </p>
          <Link href="/services">
            <Button className="bg-action-blue hover:bg-glacier-blue text-white rounded-xl px-8 py-6 font-bold shadow-[var(--brand-shadow-button)] transition-[background-color,box-shadow,transform] hover:-translate-y-0.5">
              Khám phá dịch vụ ngay
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {bookings.map((booking) => {
              const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = sc.icon;
              return (
                <Link key={booking.id} href={`/bookings/${booking.id}`}>
                  <Card className="glass-panel glow-hover rounded-[20px] py-0 cursor-pointer">
                    <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 text-white">
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                          {booking.service?.images?.[0]?.imageUrl ? (
                            <img src={booking.service.images[0].imageUrl} alt={booking.service?.name || "Hình ảnh dịch vụ"} className="w-full h-full object-cover" />
                          ) : <Package className="w-5 h-5 sm:w-6 sm:h-6 text-action-blue" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                            <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">#{booking.bookingCode}</span>
                            <Badge className={`text-[9px] sm:text-[10px] px-1.5 py-0 sm:px-2.5 sm:py-0.5 ${sc.color} border-0`}>
                              <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" /> {sc.label}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-foreground text-xs sm:text-sm truncate">{booking.service?.name}</h3>
                          <div className="mt-1 flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs text-muted-foreground min-w-0">
                            <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span className="shrink-0 hidden sm:inline">Người thực hiện:</span>
                            <span className="shrink-0 sm:hidden">Thợ:</span>
                            <span className="font-medium text-foreground truncate">
                              {booking.provider?.fullName || 'Chưa xác định'}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">{formatDate(booking.createdAt)}</p>
                        </div>
                      </div>

                      {['DONE', 'CANCELLED'].includes(booking.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[10px] sm:text-xs border-platinum-tint text-action-blue hover:bg-pale-gray shrink-0 w-full sm:w-auto h-8 sm:h-9"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/bookings/create?serviceId=${booking.serviceId}&reorderId=${booking.id}`);
                          }}
                        >
                          Đặt lại
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Trước
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                Trang {page} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="gap-1"
              >
                Sau <ChevronRightIcon className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
