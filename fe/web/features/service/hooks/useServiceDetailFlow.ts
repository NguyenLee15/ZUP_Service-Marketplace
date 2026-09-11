'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { chatApi } from '@/features/chat/services/chat.api';
import { authApi } from '@/features/auth/services/auth.api';
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

  useEffect(() => {
    if (!service?.id) return;
    const API = '/api';
    axios
      .get(`${API}/services/${service.id}/provider-stats`)
      .then((res) => setProviderStats(res.data.data))
      .catch(() => {
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

  const reviews = service?.reviews || [];
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
    images,
    reviews,
    referencePrice,
    estimateLow,
    estimateHigh,
    formatPrice,
    handleStartChat,
    handleBookNow,
    isAuthenticated,
  };
}

