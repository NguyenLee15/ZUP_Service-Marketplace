'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  MessageSquare,
  MapPin,
  Calendar,
  Shield,
  Phone,
  Mail,
  Search,
  Share2,
  Award,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/navigation/BackButton';
import { UnifiedServiceCard, UnifiedServiceCardSkeleton } from '@/app/components/services/UnifiedServiceCard';
import { serviceApi } from '@/features/service/services/service.api';
import { chatApi } from '@/features/chat/services/chat.api';
import { authApi } from '@/features/auth/services/auth.api';
import { toast } from 'sonner';
import axios from 'axios';

interface ProviderProfileClientProps {
  provider: any;
}

export function ProviderProfileClient({ provider }: ProviderProfileClientProps) {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();

  // Search, Filter & Pagination states
  const [services, setServices] = useState<any[]>([]);
  const [totalServicesCount, setTotalServicesCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, rating, priceAsc, priceDesc
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // reset to page 1 on new search
    }, 4000); // 400ms debounce

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch provider's active services
  useEffect(() => {
    setLoading(true);
    serviceApi
      .getProviderServices(provider.id, {
        page: currentPage,
        limit: 8,
        search: debouncedSearch,
        sortBy,
      })
      .then((res) => {
        const list = res.data.data || [];
        const meta = res.data.meta || {};
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
  }, [provider.id, currentPage, debouncedSearch, sortBy]);

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

      // Lấy serviceId đầu tiên của thợ nếu có để bắt đầu chat
      const firstServiceId = services[0]?.id;
      if (!firstServiceId) {
        toast.error('Không thể bắt đầu chat', {
          description: 'Nhà cung cấp này hiện chưa có dịch vụ nào đang hoạt động để nhắn tin.',
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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 animate-in fade-in duration-500">
      {/* Back Button */}
      <BackButton fallbackHref="/services" className="mb-6" />

      {/* 1. SHOP CARD (Shopee-like Profile Section) */}
      <Card className="overflow-hidden border border-platinum-tint shadow-[var(--brand-shadow-card)] rounded-[24px] py-0 bg-gradient-to-br from-midnight-indigo via-midnight-indigo/95 to-slate-blue text-white mb-8">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
          
          {/* Cột 1: Thông tin cơ bản (Avatar & Name & Buttons) */}
          <div className="flex-1 flex gap-4 md:gap-6 items-center w-full md:max-w-md">
            <div className="relative shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-white/20 bg-action-blue flex items-center justify-center text-white text-2xl md:text-3xl font-extrabold shadow-lg overflow-hidden">
                {provider.avatarUrl ? (
                  <Image
                    src={provider.avatarUrl}
                    alt={provider.fullName}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  provider.fullName?.charAt(0).toUpperCase()
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-green-500 border-2 border-midnight-indigo w-4 h-4 rounded-full" title="Đang trực tuyến" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                <h1 className="text-lg md:text-2xl font-bold tracking-tight truncate max-w-[240px]" title={provider.fullName}>
                  {provider.fullName}
                </h1>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[8px] md:text-[9px] font-bold uppercase tracking-widest border border-green-500/30">
                  <Shield className="w-2.5 h-2.5" />
                  Đối tác uy tín
                </div>
              </div>
              
              <div className="mt-2 space-y-1 text-xs md:text-sm text-white/80">
                {provider.address && (
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-white/60" />
                    <span className="truncate">{provider.address.addressDetail}, {provider.address.ward}, {provider.address.district}, {provider.address.province}</span>
                  </p>
                )}
                <p className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-white/60" />
                  Tham gia: {formatDate(provider.createdAt)}
                </p>
                
                {/* Số điện thoại & Email (Ẩn nếu chưa đăng nhập) */}
                <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] md:text-xs">
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-white/60" />
                    {isAuthenticated() ? (
                      <span>{provider.phone}</span>
                    ) : (
                      <span className="text-white/50">{provider.phone ? provider.phone.slice(0, 4) + '****' + provider.phone.slice(-2) : 'N/A'} (Đăng nhập để xem)</span>
                    )}
                  </p>
                  <p className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-white/60" />
                    {isAuthenticated() ? (
                      <span>{provider.email}</span>
                    ) : (
                      <span className="text-white/50">Che giấu (Đăng nhập để xem)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleStartChat}
                  disabled={chatLoading}
                  className="bg-white hover:bg-white/90 text-midnight-indigo font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 h-9"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {chatLoading ? 'Đang kết nối...' : 'Chat Ngay'}
                </Button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="bg-white/10 hover:bg-white/25 border border-white/30 text-white rounded-full h-9 w-9 flex items-center justify-center transition-all duration-300 active:scale-95 backdrop-blur-sm shrink-0 shadow-sm"
                  title="Chia sẻ hồ sơ"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

          </div>

          <Separator className="bg-white/10 md:hidden w-full" />
          <div className="hidden md:block h-20 w-[1px] bg-white/10" />

          {/* Cột 2: Chỉ số đánh giá & Hiệu suất (Shopee Metrics) */}
          <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Đánh giá */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-yellow-400">
                <Star className="w-4 h-4 fill-yellow-400" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold leading-tight">
                  {Number(provider.stats.avgRating).toFixed(1)} / 5.0
                </p>
                <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider mt-0.5">
                  Đánh giá ({provider.stats.totalReviews})
                </p>
              </div>
            </div>

            {/* Hoàn thành */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold leading-tight">
                  {provider.metrics?.completionRate !== null
                    ? `${provider.metrics.completionRate}%`
                    : 'N/A'}
                </p>
                <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider mt-0.5">
                  Tỷ lệ hoàn thành
                </p>
              </div>
            </div>

            {/* Phản hồi */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-action-blue">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold leading-tight">
                  {provider.metrics?.avgResponseHours !== null
                    ? `~${provider.metrics.avgResponseHours}h`
                    : 'N/A'}
                </p>
                <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider mt-0.5">
                  Phản hồi TB
                </p>
              </div>
            </div>

            {/* Dịch vụ */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-amber-400">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold leading-tight">
                  {provider.stats.totalServices}
                </p>
                <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider mt-0.5">
                  Tổng dịch vụ
                </p>
              </div>
            </div>

          </div>

        </CardContent>
      </Card>

      {/* 2. CỬA HÀNG / DANH SÁCH DỊCH VỤ */}
      <div>
        {/* Tiêu đề & Search/Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-midnight-indigo flex items-center gap-2">
              Danh sách Dịch vụ
              <Badge variant="outline" className="bg-pale-gray text-midnight-indigo font-bold text-xs px-2 py-0.5 rounded-full border-platinum-tint">
                {totalServicesCount}
              </Badge>
            </h2>
            <p className="text-muted-foreground text-xs md:text-sm mt-0.5">Các dịch vụ đang hoạt động được ủy quyền bởi {provider.fullName}.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {/* Ô tìm kiếm trong Shop */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Tìm dịch vụ tại cửa hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 w-full rounded-xl border-platinum-tint bg-white focus-visible:ring-action-blue"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Sắp xếp dropdown */}
            <div className="flex items-center gap-2 bg-white border border-platinum-tint rounded-xl px-3 h-10 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs font-semibold text-foreground outline-none bg-transparent cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="rating">Đánh giá cao</option>
                <option value="priceAsc">Giá tăng dần</option>
                <option value="priceDesc">Giá giảm dần</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lưới dịch vụ */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <UnifiedServiceCardSkeleton key={i} />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-pale-gray/30 rounded-[20px] border border-platinum-tint border-dashed">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="font-bold text-foreground">Không tìm thấy dịch vụ nào</h3>
            <p className="text-muted-foreground text-xs md:text-sm max-w-sm mt-1">
              {debouncedSearch
                ? `Không có dịch vụ nào khớp với từ khóa "${debouncedSearch}" của thợ này.`
                : 'Nhà cung cấp hiện chưa đăng tải dịch vụ nào lên hệ thống.'}
            </p>
            {debouncedSearch && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-xl"
                onClick={() => setSearchTerm('')}
              >
                Xem tất cả
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {services.map((service, index) => (
                <UnifiedServiceCard
                  key={service.id || index}
                  service={service}
                  showFavorite={false}
                  showDescription={false}
                  showTrustBadges
                  showPrimaryAction
                  useImageCarousel
                  priceMode="estimate"
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="h-9 w-9 p-0 rounded-xl"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-9 w-9 p-0 rounded-xl font-bold text-xs ${
                        currentPage === pageNum ? 'bg-action-blue text-white' : ''
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="h-9 w-9 p-0 rounded-xl"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
