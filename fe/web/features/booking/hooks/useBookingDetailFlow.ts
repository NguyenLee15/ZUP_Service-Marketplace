'use client';

import { useCallback, useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { bookingsApi } from '@/features/auth/services/api';
import { useAuthStore } from '@/store/auth.store';
import { BookingStatus } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import confetti from 'canvas-confetti';
import { useNotificationsSocket } from '@/features/notification/hooks/useNotificationsSocket';

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  ACCEPTED: 'Đã tiếp nhận',
  QUOTED: 'Đã báo giá',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  DISPUTED: 'Tranh chấp',
};

export function useBookingDetailFlow() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();

  const [booking, setBooking] = useState<ApiPayload>(null);
  const [timeline, setTimeline] = useState<ApiPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Review state
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  // Cancel/Dispute state
  const [cancelAction, setCancelAction] = useState<'CANCEL' | 'REJECT' | 'DISPUTE' | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);

  const fetchBooking = useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      bookingsApi.getById(Number(id)),
      bookingsApi.getTimeline(Number(id)).catch(() => null),
    ])
      .then(([detailRes, timelineRes]) => {
        setBooking(detailRes.data.data);
        const timelineData = timelineRes?.data?.data;
        setTimeline(Array.isArray(timelineData) ? timelineData : []);
      })
      .catch(() => router.push('/bookings'))
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const handleRealtimeBookingUpdate = useCallback(
    (notification: ApiPayload) => {
      const bookingId = Number(
        notification?.referenceId || notification?.bookingId || 0,
      );
      if (bookingId === Number(id)) fetchBooking();
    },
    [fetchBooking, id],
  );

  useNotificationsSocket(handleRealtimeBookingUpdate);

  const handleAction = async (
    action: () => Promise<ApiPayload>,
    successMsg: string,
  ) => {
    setActionLoading(true);
    try {
      await action();
      toast({ title: successMsg });

      if (successMsg === 'Đã nghiệm thu' || successMsg === 'Đã nghiệm thu thành công') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#006BFF', '#004EBA', '#476788'],
        });
      }

      fetchBooking();
    } catch (err: ApiPayload) {
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
    if (booking?.status !== BookingStatus.DONE || !booking?.completedAt)
      return null;
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
      if (diff <= 0) {
        setTimeLeft('Đã tự động nghiệm thu');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const isCustomer = user?.id === booking?.customerId;
  const statusHistory =
    timeline.length > 0 ? timeline : booking?.statusHistories || [];

  const originalQuote = booking?.quotations?.find(
    (q: ApiPayload) => q.type === 'ORIGINAL',
  );
  const supplementaryQuotes =
    booking?.quotations?.filter((q: ApiPayload) => q.type === 'SUPPLEMENTARY') || [];

  return {
    id,
    router,
    booking,
    timeline,
    loading,
    actionLoading,
    fetchBooking,
    handleAction,
    formatPrice,
    formatDate,
    timeLeft,
    isCustomer,
    statusHistory,
    originalQuote,
    supplementaryQuotes,
    showReview,
    setShowReview,
    rating,
    setRating,
    comment,
    setComment,
    cancelAction,
    setCancelAction,
    cancelReason,
    setCancelReason,
    disputeFiles,
    setDisputeFiles,
  };
}

