'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { chatApi } from '@/features/chat/services/chat.api';
import { authApi } from '@/features/auth/services/auth.api';
import { serviceApi } from '@/features/service/services/service.api';
import axios from 'axios';
import { toast } from 'sonner';
import { getSafeServiceImageSrc } from '@/lib/security/image-sources';

export interface ProviderStats {
  avgResponseHours: number | null;
  completionRate: number | null;
  totalCompleted: number;
  totalBookings: number;
}

export function useServiceDetailFlow(service: ApiPayload) {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();
  const [currentImage, setCurrentImage] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [providerStats, setProviderStats] = useState<ProviderStats | null>(null);
  const [providerStatsUnavailable, setProviderStatsUnavailable] = useState(false);
  const [reviews, setReviews] = useState<ApiPayload[]>(service?.reviews || []);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotal, setReviewsTotal] = useState(
    Number(service?.totalReviews || service?.reviews?.length || 0),
  );
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  useEffect(() => {
    setReviews(service?.reviews || []);
    setReviewsPage(1);
    setReviewsTotal(Number(service?.totalReviews || service?.reviews?.length || 0));
    setReviewsError(null);
  }, [service?.id, service?.reviews, service?.totalReviews]);

  useEffect(() => {
    if (!service?.id) return;
    const API = '/api';
    axios
      .get(`${API}/services/${service.id}/provider-stats`)
      .then((res) => {
        setProviderStats(res.data.data);
        setProviderStatsUnavailable(false);
      })
      .catch(() => {
        setProviderStatsUnavailable(true);
        /* silent — metrics là phụ, không block trang */
      });
  }, [service?.id]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);

  const images = (service?.images || []).map((image: ApiPayload) => ({
    ...image,
    imageUrl: getSafeServiceImageSrc(image.imageUrl, service),
  }));

  const reviewsHasMore = reviews.length < reviewsTotal;

  const loadMoreReviews = async () => {
    if (!service?.id || reviewsLoading || !reviewsHasMore) return;

    const nextPage = reviewsPage + 1;
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const response = await serviceApi.getReviews(service.id, {
        page: nextPage,
        limit: 10,
      });
      const payload = response.data?.data ?? response.data;
      const nextReviews = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      const meta = payload?.meta || {};

      setReviews((current) => {
        const byId = new Map(current.map((review) => [String(review.id), review]));
        nextReviews.forEach((review: ApiPayload) => byId.set(String(review.id), review));
        return Array.from(byId.values());
      });
      setReviewsPage(nextPage);
      setReviewsTotal(Number(meta.total ?? reviewsTotal));
    } catch {
      setReviewsError('Không thể tải thêm đánh giá. Vui lòng thử lại.');
    } finally {
      setReviewsLoading(false);
    }
  };
  const referencePrice = Number(service?.referencePrice || 0);
  const estimateLow = referencePrice * 0.9;
  const estimateHigh = referencePrice * 1.1;

  const handleStartChat = async () => {
    if (!isAuthenticated()) {
      router.push(`/login?redirect=/services/${service.id}`);
      return;
    }

    setChatLoading(true);
    try {
      let activeUser = user;
      if (!activeUser) {
        const profileRes = await authApi.getProfile();
        activeUser = profileRes.data?.data;
        if (activeUser) setUser(activeUser);
      }

      if (activeUser?.role !== Role.CUSTOMER) {
        toast.error('Không thể bắt đầu chat', {
          description: 'Tính năng này dành cho tài khoản khách hàng.',
        });
        return;
      }

      const res = await chatApi.getOrCreateConversation({
        serviceId: service.id,
      });
      const conversation = res.data?.data?.data || res.data?.data;
      const conversationId = Number(conversation?.id);
      if (!conversationId) throw new Error('Missing conversation id');
      router.push(`/chat?conversationId=${conversationId}`);
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ error?: { message?: string } }>(err)
        ? err.response?.data?.error?.message
        : undefined;
      toast.error('Không thể mở tin nhắn', {
        description: message || 'Vui lòng thử lại sau.',
      });
    } finally {
      setChatLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    router.push(`/bookings/create?serviceId=${service.id}`);
  };

  return {
    currentImage,
    setCurrentImage,
    chatLoading,
    providerStats,
    providerStatsUnavailable,
    images,
    reviews,
    reviewsTotal,
    reviewsHasMore,
    reviewsLoading,
    reviewsError,
    loadMoreReviews,
    referencePrice,
    estimateLow,
    estimateHigh,
    formatPrice,
    handleStartChat,
    handleBookNow,
    isAuthenticated,
  };
}

