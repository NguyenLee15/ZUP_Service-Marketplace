'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { servicesApi, categoriesApi } from '@/features/auth/services/api';
import { userApi } from '@/features/user/services/user.api';
import { useAuthStore } from '@/store/auth.store';
import { useServiceStore } from '@/store/service.store';
import type { Category, Service } from '@/types';

export const DEFAULT_SEARCH_LOCATION = {
  lat: 21.0285,
  lng: 105.8522,
  label: 'Hà Nội',
};
export const DEFAULT_RADIUS_KM = 30;

export type SearchMeta = {
  total: number;
  page: number;
  totalPages: number;
  radiusKm?: number;
  locationExpanded?: boolean;
};

export type UserLocationState = {
  lat: number;
  lng: number;
  source: 'fallback' | 'gps' | 'manual';
  label: string;
};

export function useServicesSearchFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [savedAddresses, setSavedAddresses] = useState<ApiPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [meta, setMeta] = useState<SearchMeta>({ total: 0, page: 1, totalPages: 0 });
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [userLocation, setUserLocation] = useState<UserLocationState>({
    lat: DEFAULT_SEARCH_LOCATION.lat,
    lng: DEFAULT_SEARCH_LOCATION.lng,
    source: 'fallback',
    label: DEFAULT_SEARCH_LOCATION.label,
  });
  const observerTarget = useRef<HTMLDivElement | null>(null);

  const { favorites, toggleFavoriteService, addRecentlyViewed } = useServiceStore();
  const { user } = useAuthStore();

  // Filters State
  const [categoryIds, setCategoryIds] = useState<string[]>(
    searchParams.get('categoryIds')?.split(',') || [],
  );
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(parseInt(searchParams.get('minRating') || '0', 10));
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showFloatingFilter, setShowFloatingFilter] = useState(false);

  useEffect(() => {
    setCategoryIds(searchParams.get('categoryIds')?.split(',').filter(Boolean) || []);
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setMinRating(parseInt(searchParams.get('minRating') || '0', 10));
    setSortBy(searchParams.get('sortBy') || 'newest');
  }, [searchParams]);

  // Get user location
  const fetchGpsLocation = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            source: 'gps',
            label: 'Vị trí của tôi',
          }),
        (err) => {
          if (err.code !== err.PERMISSION_DENIED) {
            console.warn('Geolocation error:', err.message);
          }
        },
        { timeout: 10000 },
      );
    }
  }, []);

  useEffect(() => {
    if (userLocation.source !== 'manual') {
      fetchGpsLocation();
    }
  }, [fetchGpsLocation, userLocation.source]);

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

  // Load categories and saved addresses
  useEffect(() => {
    categoriesApi
      .getFlat()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      userApi
        .getAddresses()
        .then((res) => setSavedAddresses(res.data.data || []))
        .catch(() => {});
    } else {
      setSavedAddresses([]);
    }
  }, [user]);

  const handleSearch = useCallback(
    async (page = 1, currentFilters?: ApiPayload, append = false) => {
      if (append) setIsFetchingMore(true);
      else {
        setLoading(true);
        setSearchError('');
      }

      try {
        const keyword = searchParams.get('keyword') || '';
        const isAiMode = searchParams.get('ai') === 'true';

        let data: Service[];
        let metaData: SearchMeta;

        if (isAiMode && keyword.trim()) {
          const res = await servicesApi.aiSearch(
            keyword.trim(),
            userLocation.lat,
            userLocation.lng,
          );
          const aiData = (res.data.data || []).map((s: ApiPayload) => ({
            ...s,
            distance: s.distanceKm ?? s.distance,
          }));

          if (sortBy === 'price_asc') {
            aiData.sort((a: ApiPayload, b: ApiPayload) => a.referencePrice - b.referencePrice);
          } else if (sortBy === 'price_desc') {
            aiData.sort((a: ApiPayload, b: ApiPayload) => b.referencePrice - a.referencePrice);
          } else if (sortBy === 'rating') {
            aiData.sort((a: ApiPayload, b: ApiPayload) => (b.avgRating || 0) - (a.avgRating || 0));
          }

          data = aiData;
          metaData = { total: data.length, page: 1, totalPages: 1 };
        } else {
          const params: Record<string, ApiPayload> = {
            page,
            limit: 12,
            sortBy,
            keyword,
            lat: userLocation.lat,
            lng: userLocation.lng,
            radiusKm: DEFAULT_RADIUS_KM,
            categoryIds: (currentFilters?.categoryIds || categoryIds).join(',') || undefined,
            minPrice: currentFilters?.minPrice || minPrice || undefined,
            maxPrice: currentFilters?.maxPrice || maxPrice || undefined,
            minRating: currentFilters?.minRating || minRating || undefined,
          };

          const res = await servicesApi.search(params);
          data = (res.data.data || []).map((s: Service) => ({
            ...s,
            distance: (s as ApiPayload).distanceKm ?? s.distance,
          }));
          metaData = res.data.meta || { total: 0, page: 1, totalPages: 0 };
        }

        if (append) {
          setServices((prev) => [...prev, ...data]);
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
        const message =
          status === 502
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
    },
    [searchParams, sortBy, categoryIds, minPrice, maxPrice, minRating, userLocation],
  );

  const handleSearchRef = useRef(handleSearch);
  handleSearchRef.current = handleSearch;

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleSearchRef.current(meta.page + 1, null, true);
        }
      },
      { threshold: 1.0 },
    );

    const target = observerTarget.current;
    if (target && meta.page < meta.totalPages && !loading && !isFetchingMore) {
      observer.observe(target);
    }

    return () => observer.disconnect();
  }, [meta.page, meta.totalPages, loading, isFetchingMore]);

  // Trigger search when searchParams or sortBy changes
  useEffect(() => {
    handleSearchRef.current(1);
  }, [searchParams, sortBy, userLocation.lat, userLocation.lng]);

  const onFilterChange = (filters: ApiPayload) => {
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
      const updated = current.filter((v) => v !== value);
      if (updated.length > 0) newParams.set('categoryIds', updated.join(','));
      else newParams.delete('categoryIds');
    } else {
      newParams.delete(key);
    }
    router.push(`/services?${newParams.toString()}`);
  };

  const activeCategories = categories.filter((c) => categoryIds.includes(c.id.toString()));
  const activeFilterCount =
    categoryIds.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minRating > 0 ? 1 : 0);
  const locationDescription = meta.locationExpanded
    ? `Không có dịch vụ trong ${meta.radiusKm || DEFAULT_RADIUS_KM} km, đang hiển thị dịch vụ gần nhất`
    : userLocation.source === 'gps'
    ? `Tìm dịch vụ trong bán kính ${meta.radiusKm || DEFAULT_RADIUS_KM} km quanh vị trí của bạn`
    : `Tìm dịch vụ quanh ${userLocation.label}`;

  return {
    router,
    searchParams,
    services,
    categories,
    savedAddresses,
    loading,
    searchError,
    meta,
    isFetchingMore,
    viewMode,
    setViewMode,
    userLocation,
    setUserLocation,
    fetchGpsLocation,
    observerTarget,
    favorites,
    toggleFavoriteService,
    addRecentlyViewed,
    categoryIds,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
    setSortBy,
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    showFloatingFilter,
    formatPrice,
    handleSearchRef,
    onFilterChange,
    onClearFilters,
    removeFilter,
    activeCategories,
    activeFilterCount,
    locationDescription,
  };
}

