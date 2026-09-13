'use client';

import Image from 'next/image';
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
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { BackButton } from '@/components/navigation/BackButton';
import { UnifiedServiceCard, UnifiedServiceCardSkeleton } from '@/app/components/services/UnifiedServiceCard';
import { useProviderProfileFlow } from '@/features/provider/hooks/useProviderProfileFlow';
import { CustomerPageHeader } from '@/components/customer/CustomerPageHeader';

interface ProviderProfileClientProps {
  provider: ApiPayload;
}

export function ProviderProfileClient({ provider }: ProviderProfileClientProps) {
  const {
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
  } = useProviderProfileFlow(provider);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-24 animate-in fade-in duration-500">
      {/* Back Button */}
      <BackButton fallbackHref="/services" className="mb-6" />

      {/* 1. SHOP CARD (Shopee-like Profile Section) */}
      <Card className="overflow-hidden border border-border shadow-sm rounded-2xl py-0 bg-card text-foreground mb-8">
        <CardContent className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
          
          {/* Cột 1: Thông tin cơ bản (Avatar & Name & Buttons) */}
          <div className="flex-1 flex gap-4 md:gap-6 items-center w-full md:max-w-md">
            <div className="relative shrink-0">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-primary text-2xl md:text-3xl font-extrabold shadow-sm overflow-hidden">
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
                <h2 className="text-lg md:text-2xl font-bold tracking-tight truncate max-w-[240px]" title={provider.fullName}>
                  {provider.fullName}
                </h2>
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[8px] md:text-[9px] font-bold uppercase tracking-widest border border-green-500/30">
                  <Shield className="w-2.5 h-2.5" />
                  Đối tác uy tín
                </div>
              </div>
              
              <div className="mt-2 space-y-1 text-xs md:text-sm text-muted-foreground">
                {provider.address && (
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{provider.address.addressDetail}, {provider.address.ward}, {provider.address.district}, {provider.address.province}</span>
                  </p>
                )}
                <p className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  Tham gia: {formatDate(provider.createdAt)}
                </p>
                
                {/* Số điện thoại & Email (Ẩn nếu chưa đăng nhập) */}
                <div className="pt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] md:text-xs">
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                    {isAuthenticated() ? (
                      <span>{provider.phone}</span>
                    ) : (
                      <span className="text-muted-foreground">{provider.phone ? provider.phone.slice(0, 4) + '****' + provider.phone.slice(-2) : 'N/A'} (Đăng nhập để xem)</span>
                    )}
                  </p>
                  <p className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                    {isAuthenticated() ? (
                      <span>{provider.email}</span>
                    ) : (
                      <span className="text-muted-foreground">Che giấu (Đăng nhập để xem)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="mt-4 flex gap-2">
                <Button
                  onClick={handleStartChat}
                  disabled={chatLoading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 h-10"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {chatLoading ? 'Đang kết nối...' : 'Chat Ngay'}
                </Button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="bg-muted hover:bg-muted/80 border border-border text-foreground rounded-full h-10 w-10 flex items-center justify-center transition-colors shrink-0 shadow-sm"
                  title="Chia sẻ hồ sơ"
                  aria-label="Chia sẻ hồ sơ nhà cung cấp"
                >
                  <Share2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

          </div>

          <Separator className="bg-border md:hidden w-full" />
          <div className="hidden md:block h-20 w-[1px] bg-border" />

          {/* Cột 2: Chỉ số đánh giá & Hiệu suất (Shopee Metrics) */}
          <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Đánh giá */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                <Star className="w-4 h-4 fill-yellow-400" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold leading-tight">
                  {Number(provider.stats.avgRating).toFixed(1)} / 5.0
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                  Đánh giá ({provider.stats.totalReviews})
                </p>
              </div>
            </div>

            {/* Hoàn thành */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold leading-tight">
                  {provider.metrics?.completionRate !== null
                    ? `${provider.metrics.completionRate}%`
                    : 'N/A'}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                  Tỷ lệ hoàn thành
                </p>
              </div>
            </div>

            {/* Phản hồi */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold leading-tight">
                  {provider.metrics?.avgResponseHours !== null
                    ? `~${provider.metrics.avgResponseHours}h`
                    : 'N/A'}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                  Phản hồi TB
                </p>
              </div>
            </div>

            {/* Dịch vụ */}
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold leading-tight">
                  {provider.stats.totalServices}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
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
            <CustomerPageHeader eyebrow="Hồ sơ nhà cung cấp" title={`Dịch vụ của ${provider.fullName}`} description={`Các dịch vụ đang hoạt động · ${totalServicesCount} lựa chọn`} />
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
                className="pl-9 h-10 w-full rounded-xl border-border bg-background focus-visible:ring-primary"
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
            <div className="flex items-center gap-2 bg-background border border-border rounded-xl px-3 h-10 shrink-0">
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
            <Package className="mb-3 h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
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
