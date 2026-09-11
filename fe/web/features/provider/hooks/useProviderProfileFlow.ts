'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { serviceApi } from '@/features/service/services/service.api';
import { chatApi } from '@/features/chat/services/chat.api';
import { authApi } from '@/features/auth/services/auth.api';
import { toast } from 'sonner';
import axios from 'axios';

export function useProviderProfileFlow(provider: ApiPayload) {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();

  const [services, setServices] = useState<ApiPayload[]>([]);
  const [totalServicesCount, setTotalServicesCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (!provider?.id) return;
    setLoading(true);
    serviceApi
      .getProviderServices(provider.id, {
        page: currentPage,
        limit: 8,
        search: debouncedSearch,
        sortBy,
      })
      .then((res) => {
        const list = res.data?.data || [];
        const meta = res.data?.meta || {};
        setServices(list);
        setTotalServicesCount(meta.total || 0);
        setTotalPages(meta.totalPages || 1);
      })
      .catch((err) => {
        console.error('Failed to fetch provider services:', err);
        toast.error('Không thể tải danh sách dịch vụ của thợ.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [provider?.id, currentPage, debouncedSearch, sortBy]);

  const handleStartChat = async () => {
    if (!isAuthenticated()) {
      router.push(`/login?redirect=/providers/${provider.id}`);
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

      const firstServiceId = services[0]?.id;
      if (!firstServiceId) {
        toast.error('Không thể bắt đầu chat', {
          description:
            'Nhà cung cấp này hiện chưa có dịch vụ nào đang hoạt động để nhắn tin.',
        });
        return;
      }

      const res = await chatApi.getOrCreateConversation({
        serviceId: firstServiceId,
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

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Hồ sơ Đối tác ${provider.fullName} | Zup`,
          text: `Xem các dịch vụ chất lượng cao được cung cấp bởi ${provider.fullName} trên Zup.`,
          url: window.location.href,
        })
        .catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Đã sao chép liên kết hồ sơ thợ vào bộ nhớ tạm.');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `Tháng ${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  return {
    services,
    totalServicesCount,
    currentPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    sortBy,
    setSortBy,
    loading,
    chatLoading,
    setCurrentPage,
    handleStartChat,
    handleShare,
    formatDate,
    isAuthenticated,
  };
}
