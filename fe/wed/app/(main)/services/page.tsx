'use client';

import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { 
  Search, 
  Sparkles, 
  X, 
  Filter, 
  Map as MapIcon, 
  LayoutGrid, 
  Mic
} from 'lucide-react';
import { servicesApi, categoriesApi } from '@/features/auth/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Service, Category } from '@/types';
import { ServiceFilterSidebar } from '@/app/components/services/ServiceFilterSidebar';
import { UnifiedServiceCard } from '@/app/components/services/UnifiedServiceCard';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useServiceStore } from '@/store/service.store';
const ServiceMap = dynamic(() => import('@/app/components/services/ServiceMap').then(mod => mod.ServiceMap), { 
  ssr: false,
  loading: () => <div className="w-full h-[600px] surface-card rounded-[20px] flex items-center justify-center font-bold text-muted-foreground uppercase tracking-widest">Đang tải bản đồ…</div>
});

const DEFAULT_SEARCH_LOCATION = {
  lat: 21.0285,
  lng: 105.8522,
  label: 'Hà Nội',
};
const DEFAULT_RADIUS_KM = 10;

type SearchMeta = {
  total: number;
  page: number;
  totalPages: number;
  radiusKm?: number;
  locationExpanded?: boolean;
};

type UserLocationState = {
  lat: number;
  lng: number;
  source: 'fallback' | 'gps';
};

export default function ServicesSearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-action-blue border-t-transparent rounded-full animate-spin" /></div>}>
      <ServicesSearchContent />
    </Suspense>
  );
}

function ServicesSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [meta, setMeta] = useState<SearchMeta>({ total: 0, page: 1, totalPages: 0 });
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [userLocation, setUserLocation] = useState<UserLocationState>({
    lat: DEFAULT_SEARCH_LOCATION.lat,
    lng: DEFAULT_SEARCH_LOCATION.lng,
    source: 'fallback',
  });
  const [isListening, setIsListening] = useState(false);
  const observerTarget = useRef(null);

  const { favorites, toggleFavoriteService, addRecentlyViewed } = useServiceStore();

  // Filters State
  const [categoryIds, setCategoryIds] = useState<string[]>(searchParams.get('categoryIds')?.split(',') || []);
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(parseInt(searchParams.get('minRating') || '0'));
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showFloatingFilter, setShowFloatingFilter] = useState(false);

  useEffect(() => {
    setCategoryIds(searchParams.get('categoryIds')?.split(',').filter(Boolean) || []);
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setMinRating(parseInt(searchParams.get('minRating') || '0'));
    setSortBy(searchParams.get('sortBy') || 'newest');
  }, [searchParams]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, source: 'gps' }),
        (err) => {
          // Chỉ log lỗi nếu không phải là do người dùng từ chối quyền
          if (err.code !== err.PERMISSION_DENIED) {
            console.warn('Geolocation error:', err.message);
          }
        },
        { timeout: 10000 }
      );
    }
  }, []);

  // Voice Search Logic
  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Trình duyệt không hỗ trợ', description: 'Tính năng tìm kiếm giọng nói cần trình duyệt hiện đại hơn.', variant: 'destructive' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('main-search-input') as HTMLInputElement;
      if (input) {
        input.value = transcript;
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('keyword', transcript);
        router.push(`/services?${newParams.toString()}`);
        toast({ title: 'Tìm kiếm giọng nói', description: `Đang tìm: "${transcript}"` });
      }
    };

    recognition.start();
  };

  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  }, []);

  // Handle scroll to show/hide floating filter button
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowFloatingFilter(true);
      } else {
        setShowFloatingFilter(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load categories
  useEffect(() => {
    categoriesApi.getFlat().then((res) => setCategories(res.data.data || [])).catch(() => {});
  }, []);

  const handleSearch = useCallback(async (page = 1, currentFilters?: any, append = false) => {
    if (append) setIsFetchingMore(true);
    else {
      setLoading(true);
      setSearchError('');
    }
    
    try {
      const params: Record<string, any> = { 
        page, 
        limit: 12, 
        sortBy,
        keyword: searchParams.get('keyword') || '',
        lat: userLocation.lat,
        lng: userLocation.lng,
        radiusKm: DEFAULT_RADIUS_KM,
        categoryIds: (currentFilters?.categoryIds || categoryIds).join(',') || undefined,
        minPrice: currentFilters?.minPrice || minPrice || undefined,
        maxPrice: currentFilters?.maxPrice || maxPrice || undefined,
        minRating: currentFilters?.minRating || minRating || undefined,
      };

      const res = await servicesApi.search(params);
      const data = (res.data.data || []).map((s: Service) => ({
        ...s,
        distance: s.distanceKm ?? s.distance,
      }));

      const metaData = res.data.meta || { total: 0, page: 1, totalPages: 0 };
      
      if (append) {
        setServices(prev => [...prev, ...data]);
      } else {
        setServices(data);
      }

      if (metaData.total === 0 && data.length > 0) {
        metaData.total = data.length;
      }
      setMeta(metaData);
      setSearchError('');
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const message = status === 502
        ? 'Không kết nối được máy chủ dữ liệu. Vui lòng kiểm tra backend hoặc thử lại.'
        : 'Không thể tải danh sách dịch vụ. Vui lòng thử lại.';

      setSearchError(message);
      if (!append) {
        setServices([]);
        setMeta({ total: 0, page: 1, totalPages: 0 });
      }
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  }, [searchParams, sortBy, categoryIds, minPrice, maxPrice, minRating, userLocation]);

  // Ref ổn định cho handleSearch — tránh re-create observer
  const handleSearchRef = useRef(handleSearch);
  handleSearchRef.current = handleSearch;

  // Infinite Scroll Observer — dùng ref ổn định để tránh re-create
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          handleSearchRef.current(meta.page + 1, null, true);
        }
      },
      { threshold: 1.0 }
    );

    const target = observerTarget.current;
    // Chỉ observe khi còn trang tiếp theo
    if (target && meta.page < meta.totalPages && !loading && !isFetchingMore) {
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, [meta.page, meta.totalPages, loading, isFetchingMore]);

  // Trigger search khi searchParams hoặc sortBy thay đổi
  useEffect(() => {
    handleSearchRef.current(1);
  }, [searchParams, sortBy, userLocation.lat, userLocation.lng]);

  const onFilterChange = (filters: any) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) newParams.set(key, value.join(','));
        else newParams.delete(key);
      } else if (value) {
        newParams.set(key, value as string);
      } else {
        newParams.delete(key);
      }
    });
    router.push(`/services?${newParams.toString()}`);
    setIsMobileFilterOpen(false);
  };

  const onClearFilters = () => {
    router.push('/services');
    setCategoryIds([]);
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setIsMobileFilterOpen(false);
  };

  const removeFilter = (key: string, value?: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (key === 'categoryIds' && value) {
      const current = newParams.get('categoryIds')?.split(',') || [];
      const updated = current.filter(v => v !== value);
      if (updated.length > 0) newParams.set('categoryIds', updated.join(','));
      else newParams.delete('categoryIds');
    } else {
      newParams.delete(key);
    }
    router.push(`/services?${newParams.toString()}`);
  };

  const activeCategories = categories.filter(c => categoryIds.includes(c.id.toString()));
  const activeFilterCount =
    categoryIds.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minRating > 0 ? 1 : 0);
  const locationDescription = meta.locationExpanded
    ? `Không có dịch vụ trong ${meta.radiusKm || DEFAULT_RADIUS_KM} km, đang hiển thị dịch vụ gần nhất`
    : userLocation.source === 'gps'
      ? `Tìm dịch vụ trong bán kính ${meta.radiusKm || DEFAULT_RADIUS_KM} km quanh vị trí của bạn`
      : `Tìm dịch vụ quanh ${DEFAULT_SEARCH_LOCATION.label}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-platinum-tint">
        <div className="max-w-7xl mx-auto px-0 py-4 sm:px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4 flex-1">
              <div className="hidden xl:block min-w-[180px]">
                <p className="text-xs font-bold text-muted-foreground">HomeService</p>
                <h1 className="text-lg font-bold tracking-tight text-midnight-indigo">Tìm dịch vụ tại nhà</h1>
              </div>
              <div className="relative min-w-0 flex-1 max-w-2xl group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className={`w-5 h-5 transition-colors duration-300 ${loading ? 'text-action-blue' : 'text-muted-foreground group-focus-within:text-action-blue'}`} />
                </div>
                <Input 
                  id="main-search-input"
                  name="services-search"
                  aria-label="Tìm kiếm dịch vụ"
                  autoComplete="off"
                  placeholder="Tìm kiếm dịch vụ…" 
                  className="pl-12 pr-12 h-14 bg-cloud-mist border border-platinum-tint focus:border-action-blue focus:ring-action-blue/20 rounded-2xl text-base shadow-sm transition-[background-color,border-color,box-shadow] hover:bg-pale-gray/60 group-focus-within:bg-white group-focus-within:shadow-md"
                  defaultValue={searchParams.get('keyword') || ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const newParams = new URLSearchParams(searchParams.toString());
                      newParams.set('keyword', e.currentTarget.value);
                      router.push(`/services?${newParams.toString()}`);
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={startVoiceSearch}
                  aria-label={isListening ? 'Dừng nghe tìm kiếm giọng nói' : 'Tìm kiếm bằng giọng nói'}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full transition-[background-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue ${
                    isListening ? 'bg-red-500 text-white' : 'text-muted-foreground hover:text-action-blue hover:bg-pale-gray'
                  }`}
                >
                  {isListening ? <Mic className="w-5 h-5" /> : <Mic className="w-5 h-5 opacity-40" />}
                </button>
              </div>
            </div>
            
              <div className="flex w-full items-center gap-3 md:w-auto md:pl-4 md:border-l border-border">
                <Sheet open={isMobileFilterOpen} onOpenChange={setIsMobileFilterOpen}>
                  <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Mở bộ lọc"
                    className="relative h-12 w-12 rounded-xl border-platinum-tint hover:bg-pale-gray hover:text-action-blue transition-colors"
                  >
                    <Filter className="w-5 h-5" />
                    {activeFilterCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-action-blue px-1 text-[10px] font-bold text-white">
                        {activeFilterCount > 9 ? '9+' : activeFilterCount}
                      </span>
                    )}
                  </Button>
                  </SheetTrigger>
                <SheetContent side="right" className="w-[min(22rem,calc(100vw_-_1rem))] border-l border-white/10 bg-slate-950/95 p-0 text-white shadow-[0_18px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
                  <SheetHeader className="border-b border-white/10 bg-white/[0.03] p-5">
                    <SheetTitle className="text-left text-lg font-bold tracking-tight text-white">Bộ lọc tìm kiếm</SheetTitle>
                  </SheetHeader>
                  <div className="overflow-y-auto h-full pb-20">
                    <ServiceFilterSidebar 
                      categories={categories}
                      onFilterChange={onFilterChange}
                      onClear={onClearFilters}
                      currentFilters={{ categoryIds, minPrice, maxPrice, minRating }}
                    />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="hidden md:flex items-center gap-2 px-4 h-12 bg-pale-gray rounded-xl border border-platinum-tint">
                <Sparkles className="w-4 h-4 text-action-blue" />
                <span className="text-xs font-bold text-glacier-blue whitespace-nowrap">
                  {meta.total} kết quả tìm thấy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-0 py-6 sm:px-4 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-12">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 sm:gap-6 mb-6">
              <div className="min-w-0 space-y-1">
                <h2 className="text-2xl sm:text-3xl font-bold brand-heading leading-tight flex items-center gap-3 break-words text-balance">
                  {searchParams.get('keyword') ? (
                    <>Kết quả cho &quot;{searchParams.get('keyword')}&quot;</>
                  ) : activeCategories.length === 1 ? (
                    <>{activeCategories[0].name}</>
                  ) : activeCategories.length > 1 ? (
                    <>{activeCategories.length} danh mục đã chọn</>
                  ) : (
                    <>Tất cả dịch vụ</>
                  )}
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground font-medium text-pretty">
                  {locationDescription}
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto md:items-center">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-10 w-full rounded-xl border-white/10 bg-[#101827] text-slate-100 shadow-sm hover:border-cyan-300/35 focus:ring-cyan-300/30 sm:w-[180px]">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#101827] text-slate-100 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                    <SelectItem className="cursor-pointer text-slate-100 focus:bg-cyan-400/12 focus:text-cyan-200 data-[highlighted]:bg-cyan-400/12 data-[highlighted]:text-cyan-200" value="newest">Mới nhất</SelectItem>
                    <SelectItem className="cursor-pointer text-slate-100 focus:bg-cyan-400/12 focus:text-cyan-200 data-[highlighted]:bg-cyan-400/12 data-[highlighted]:text-cyan-200" value="price_asc">Giá tăng dần</SelectItem>
                    <SelectItem className="cursor-pointer text-slate-100 focus:bg-cyan-400/12 focus:text-cyan-200 data-[highlighted]:bg-cyan-400/12 data-[highlighted]:text-cyan-200" value="price_desc">Giá giảm dần</SelectItem>
                    <SelectItem className="cursor-pointer text-slate-100 focus:bg-cyan-400/12 focus:text-cyan-200 data-[highlighted]:bg-cyan-400/12 data-[highlighted]:text-cyan-200" value="rating">Đánh giá cao</SelectItem>
                  </SelectContent>
                </Select>

                <div className="grid w-full grid-cols-2 gap-1 bg-pale-gray p-1 rounded-xl border border-platinum-tint sm:w-auto">
                  <Button 
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`rounded-lg px-3 h-8 ${viewMode === 'grid' ? 'bg-white shadow-sm text-action-blue' : 'text-slate-blue'}`}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Lưới
                  </Button>
                  <Button 
                    variant={viewMode === 'map' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => setViewMode('map')}
                    className={`rounded-lg px-3 h-8 ${viewMode === 'map' ? 'bg-white shadow-sm text-action-blue' : 'text-slate-blue'}`}
                  >
                    <MapIcon className="w-4 h-4 mr-2" />
                    Bản đồ
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-10 empty:hidden">
              {activeCategories.map(cat => (
                <Badge key={cat.id} variant="secondary" className="pl-3 pr-1 py-1.5 rounded-full bg-pale-gray text-glacier-blue border-platinum-tint gap-2 font-bold transition-colors hover:bg-platinum-tint/60">
                  Danh mục: {cat.name}
                  <button type="button" aria-label={`Bỏ lọc ${cat.name}`} onClick={() => removeFilter('categoryIds', cat.id.toString())} className="p-0.5 hover:bg-platinum-tint rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              ))}
              {minPrice && (
                <Badge variant="secondary" className="pl-3 pr-1 py-1.5 rounded-full bg-pale-gray text-glacier-blue border-platinum-tint gap-2 font-bold transition-colors hover:bg-platinum-tint/60">
                  Từ {formatPrice(Number(minPrice))}
                  <button type="button" aria-label="Bỏ lọc giá tối thiểu" onClick={() => removeFilter('minPrice')} className="p-0.5 hover:bg-platinum-tint rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              )}
              {maxPrice && (
                <Badge variant="secondary" className="pl-3 pr-1 py-1.5 rounded-full bg-pale-gray text-glacier-blue border-platinum-tint gap-2 font-bold transition-colors hover:bg-platinum-tint/60">
                  Đến {formatPrice(Number(maxPrice))}
                  <button type="button" aria-label="Bỏ lọc giá tối đa" onClick={() => removeFilter('maxPrice')} className="p-0.5 hover:bg-platinum-tint rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              )}
              {minRating > 0 && (
                <Badge variant="secondary" className="pl-3 pr-1 py-1.5 rounded-full bg-amber-pop/15 text-midnight-indigo border-amber-pop/30 gap-2 font-bold transition-colors hover:bg-amber-pop/20">
                  {minRating}+ Sao
                  <button type="button" aria-label="Bỏ lọc đánh giá" onClick={() => removeFilter('minRating')} className="p-0.5 hover:bg-amber-pop/20 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </Badge>
              )}
              {(categoryIds.length > 0 || minPrice || maxPrice || minRating > 0) && (
                <button 
                  onClick={onClearFilters}
                  className="text-xs font-bold text-muted-foreground hover:text-red-500 transition-colors px-2"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {searchError && (
              <div
                role="status"
                aria-live="polite"
                className="mb-6 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-bold">Không tải được dữ liệu dịch vụ</p>
                  <p className="text-sm text-amber-800">{searchError}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleSearchRef.current(1)}
                  className="shrink-0 border-amber-300 bg-white hover:bg-amber-100 transition-colors"
                >
                  Thử lại
                </Button>
              </div>
            )}

            {viewMode === 'map' ? (
              <ServiceMap services={services} userLocation={userLocation.source === 'gps' ? userLocation : null} />
            ) : loading && !isFetchingMore ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                  className="h-[260px] sm:h-[300px] surface-card rounded-2xl overflow-hidden relative"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
                ))}
              </div>
            ) : services.length === 0 ? (
              <div className="surface-card flex flex-col items-center justify-center py-20 sm:py-32 text-center rounded-[20px] border-dashed transition-colors animate-in fade-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-pale-gray rounded-full flex items-center justify-center mb-8 relative">
                  <Search className="w-10 h-10 text-muted-foreground/30" />
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-action-blue rounded-full flex items-center justify-center border-4 border-background">
                    <X className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h3 className="max-w-sm px-4 text-xl sm:text-2xl font-bold brand-heading mb-3 text-balance">Không tìm thấy kết quả nào</h3>
                <p className="text-muted-foreground max-w-sm px-4 text-pretty leading-relaxed">
                  Chúng tôi không tìm thấy dịch vụ nào khớp với tiêu chí bạn chọn. Thử mở rộng bộ lọc hoặc tìm kiếm lại nhé!
                </p>
                <Button 
                  onClick={onClearFilters} 
                  variant="outline" 
                  className="mt-8 px-8 py-6 rounded-xl border-platinum-tint hover:bg-pale-gray hover:text-action-blue transition-colors font-bold"
                >
                  Xóa tất cả bộ lọc
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {services.map((service, index) => {
                  const isFavorite = favorites.includes(service.id);

                  return (
                    <div 
                      key={`${service.id}-${index}`} 
                      className="group animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <UnifiedServiceCard
                        service={service}
                        priority={index < 3}
                        isFavorite={isFavorite}
                        showFavorite
                        showDescription={false}
                        showTrustBadges
                        showPrimaryAction
                        useImageCarousel
                        priceMode="estimate"
                        onToggleFavorite={toggleFavoriteService}
                        onRecentlyViewed={addRecentlyViewed}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Loader */}
            <div ref={observerTarget} className="h-20 flex items-center justify-center mt-10">
              {isFetchingMore && (
                <div className="flex flex-col items-center gap-2 animate-in fade-in duration-500">
                  <div className="w-6 h-6 border-2 border-action-blue border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Đang tải thêm…</span>
                </div>
              )}
              {!isFetchingMore && meta.page >= meta.totalPages && services.length > 0 && (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-12 h-0.5 bg-border rounded-full" />
                  <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Bạn đã xem hết dịch vụ</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Filter Button (Mobile) */}
      <div 
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 lg:hidden transition-[opacity,transform] duration-300 transform ${
          showFloatingFilter ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
        }`}
      >
        <Button 
          onClick={() => setIsMobileFilterOpen(true)}
          className="rounded-full bg-action-blue hover:bg-glacier-blue text-white font-bold h-14 px-8 shadow-[var(--brand-shadow-button)] flex items-center gap-3 border-2 border-white/40 backdrop-blur-md"
        >
          <Filter className="w-5 h-5" />
          <span>Lọc dịch vụ</span>
          <Badge className="bg-white text-action-blue border-0 h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
            {Object.values({ categoryIds, minPrice, maxPrice, minRating }).filter(v => v && v !== '0').length}
          </Badge>
        </Button>
      </div>
    </div>
  );
}
