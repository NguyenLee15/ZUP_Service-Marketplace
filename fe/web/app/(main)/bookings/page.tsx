'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Clock, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight as ChevronRightIcon, User, Loader2 } from 'lucide-react';
import { bookingsApi } from '@/features/auth/services/api';
import { useNotificationsSocket } from '@/features/notification/hooks/useNotificationsSocket';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Booking } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Chờ xử lý', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300', icon: Clock },
  ACCEPTED: { label: 'Đã tiếp nhận', color: 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300', icon: CheckCircle },
  QUOTED: { label: 'Đã báo giá', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300', icon: Package },
  CONFIRMED: { label: 'Đã xác nhận', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300', icon: CheckCircle },
  IN_PROGRESS: { label: 'Đang thực hiện', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/50 dark:text-cyan-300', icon: Clock },
  DONE: { label: 'Hoàn thành', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300', icon: CheckCircle },
  DISPUTED: { label: 'Khiếu nại', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300', icon: AlertTriangle },
  CANCELLED: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: XCircle },
};

const PAGE_SIZE = 10;

export default function BookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const fetchBookings = useCallback(() => {
    setIsFetching(true);
    const params: any = { page, limit: PAGE_SIZE };
    if (status) params.status = status;
    bookingsApi.getMyBookings(params)
      .then((res) => {
        setBookings(res.data.data || []);
        if (res.data.meta) setMeta(res.data.meta);
        setInitialLoading(false);
      })
      .catch(() => {})
      .finally(() => setIsFetching(false));
  }, [status, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useNotificationsSocket(useCallback(() => {
    fetchBookings();
  }, [fetchBookings]));

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
          <TabsTrigger value="DISPUTED" className="text-xs">Khiếu nại</TabsTrigger>
          <TabsTrigger value="CANCELLED" className="text-xs">Đã hủy</TabsTrigger>
        </TabsList>
      </Tabs>

      {initialLoading ? (
        <div className="space-y-3">
           {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-border bg-card text-center py-16 px-4 mt-6 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1.5">Bạn chưa có đơn đặt dịch vụ nào</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6 leading-relaxed">
            Bạn chưa tạo yêu cầu dịch vụ nào trong mục này. Khám phá các dịch vụ gia đình để đặt lịch thợ nhanh chóng.
          </p>
          <Button asChild className="rounded-lg px-6 font-medium">
            <Link href="/services">
              Khám phá dịch vụ
            </Link>
          </Button>
        </div>
      ) : (
        <div className="relative">
          {isFetching && !initialLoading && (
             <div className="absolute top-0 right-0 z-10 flex items-center gap-2 px-3 py-1 bg-background/80 backdrop-blur-sm text-xs text-muted-foreground rounded-bl-lg">
               <Loader2 className="w-3 h-3 animate-spin" /> Đang cập nhật...
             </div>
          )}
          <div className={`space-y-3 transition-opacity duration-300 ${isFetching ? 'opacity-60 pointer-events-none' : ''}`}>
            {bookings.map((booking) => {
              const sc = STATUS_CONFIG[booking.status] || STATUS_CONFIG.PENDING;
              const StatusIcon = sc.icon;
              return (
                <Card key={booking.id} className="rounded-xl border border-border bg-card shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors py-0">
                  <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <Link
                      href={`/bookings/${booking.id}`}
                      className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 group"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted border border-border/70 flex items-center justify-center shrink-0 overflow-hidden">
                        {booking.service?.images?.[0]?.imageUrl ? (
                          <img src={booking.service.images[0].imageUrl} alt={booking.service?.name || "Hình ảnh dịch vụ"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        ) : <Package className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600 dark:text-sky-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <span className="text-[10px] sm:text-xs text-muted-foreground font-mono">#{booking.bookingCode}</span>
                          <Badge className={`text-[9px] sm:text-[10px] px-1.5 py-0 sm:px-2.5 sm:py-0.5 ${sc.color} border-0`}>
                            <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" /> {sc.label}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-foreground text-xs sm:text-sm truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{booking.service?.name}</h3>
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
                    </Link>

                    {['DONE', 'CANCELLED'].includes(booking.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs shrink-0 w-full sm:w-auto h-8 sm:h-9"
                        onClick={() => {
                          router.push(`/bookings/create?serviceId=${booking.serviceId}&reorderId=${booking.id}`);
                        }}
                      >
                        Đặt lại
                      </Button>
                    )}
                  </CardContent>
                </Card>
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
        </div>
      )}
    </div>
  );
}
