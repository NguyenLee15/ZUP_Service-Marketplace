import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';
import {
  AdminBookingDetailData,
  AdminBookingTimelineItem,
  BOOKING_STATUS_CONFIG,
} from '../types/admin-booking-detail.types';

export function useAdminBookingDetailFlow(id: number | null) {
  const router = useRouter();
  const { toast } = useToast();

  const [booking, setBooking] = useState<AdminBookingDetailData | null>(null);
  const [timeline, setTimeline] = useState<AdminBookingTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookingDetail = useCallback(async (bookingId: number) => {
    setLoading(true);
    try {
      const [detailRes, timelineRes] = await Promise.all([
        adminApi.getBookingDetail(bookingId),
        adminApi.getBookingTimeline(bookingId).catch(() => null),
      ]);
      const data = detailRes.data?.data as AdminBookingDetailData;
      setBooking(data);
      const timelineData = timelineRes?.data?.data;
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
    } catch {
      toast({
        title: 'Không thể tải chi tiết đơn hàng',
        description: 'Vui lòng kiểm tra lại đường dẫn',
        variant: 'destructive',
      });
      router.push('/admin/bookings');
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    if (!id || isNaN(id)) return;
    fetchBookingDetail(id);
  }, [id, fetchBookingDetail]);

  const statusConfig = useMemo(() => {
    if (!booking) {
      return { label: '', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    return (
      BOOKING_STATUS_CONFIG[booking.status] || {
        label: booking.status,
        color: 'bg-slate-100 text-slate-700 border-slate-200',
      }
    );
  }, [booking]);

  const canCancel = useMemo(() => {
    if (!booking) return false;
    return (
      booking.status === 'PENDING' ||
      booking.status === 'ACCEPTED' ||
      booking.status === 'QUOTED'
    );
  }, [booking]);

  const statusHistory = useMemo(() => {
    if (timeline.length > 0) return timeline;
    return booking?.statusHistories || [];
  }, [timeline, booking?.statusHistories]);

  const handleCancelBooking = async () => {
    if (!id) return;
    if (!cancelReason.trim()) {
      toast({ title: 'Vui lòng nhập lý do hủy đơn', variant: 'destructive' });
      return;
    }

    setActionLoading(true);
    try {
      await adminApi.cancelBooking(id, cancelReason);
      toast({ title: 'Đã hủy đơn hàng thành công' });
      setShowCancelModal(false);
      setCancelReason('');
      await fetchBookingDetail(id);
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { message?: string; error?: { message?: string } } };
        message?: string;
      };
      const errMsg =
        apiErr.response?.data?.error?.message ||
        apiErr.response?.data?.message ||
        apiErr.message ||
        'Không thể hủy đơn hàng';

      toast({
        title: 'Lỗi',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  return {
    booking,
    timeline,
    loading,
    cancelReason,
    showCancelModal,
    actionLoading,
    statusConfig,
    canCancel,
    statusHistory,
    setCancelReason,
    setShowCancelModal,
    handleCancelBooking,
    refetch: () => id && fetchBookingDetail(id),
  };
}

