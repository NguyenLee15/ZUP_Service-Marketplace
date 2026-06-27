import { useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { serviceApi } from '../service.api';
import { normalizeList, normalizePaginated } from '../../../lib/api-response';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
import { useUserLocation } from '../../../hooks/useUserLocation';

export type SearchService = {
  id?: number | string;
  name?: string;
  images?: Array<{ imageUrl?: string }>;
  provider?: { fullName?: string };
  category?: { name?: string };
  avgRating?: number | string;
  totalReviews?: number | string;
  referencePrice?: number | string;
};

export type SearchCategory = {
  id?: number | string;
  name?: string;
  children?: SearchCategory[];
};

export type SearchFilters = {
  categoryId: string;
  minRating: string;
  maxPrice: string;
  aiMode: boolean;
  sort: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

const SORT_PRESETS = [
  { label: 'Đánh giá cao', value: 'rating' },
  { label: 'Phổ biến nhất', value: 'popular' },
  { label: 'Giá thấp nhất', value: 'price' },
  { label: 'Mới nhất', value: 'newest' },
];

const PAGE_SIZE = 12;
const DEFAULT_SORT = 'rating';

function flattenCategories(categories: SearchCategory[]): SearchCategory[] {
  const result: SearchCategory[] = [];
  const visit = (items: SearchCategory[]) => {
    items.forEach((item) => {
      result.push(item);
      if (Array.isArray(item.children) && item.children.length > 0) {
        visit(item.children);
      }
    });
  };
  visit(categories);
  return result;
}

function buildSearchParams({
  keyword,
  filters,
  page,
}: {
  keyword: string;
  filters: SearchFilters;
  page: number;
}) {
  const trimmedKeyword = keyword.trim();
  return {
    q: trimmedKeyword || undefined,
    keyword: trimmedKeyword || undefined,
    categoryId: filters.categoryId || undefined,
    minRating: filters.minRating || undefined,
    maxPrice: filters.maxPrice || undefined,
    sort: filters.sort,
    lat: filters.lat,
    lng: filters.lng,
    radiusKm: filters.radiusKm || 30,
    page,
    limit: PAGE_SIZE,
  };
}

function hasActiveFilters(filters: SearchFilters) {
  return Boolean(filters.categoryId || filters.minRating || filters.maxPrice || filters.aiMode);
}

function countActiveFilters(filters: SearchFilters) {
  let count = 0;
  if (filters.categoryId) count++;
  if (filters.minRating) count++;
  if (filters.maxPrice) count++;
  if (filters.aiMode) count++;
  if (filters.sort && filters.sort !== DEFAULT_SORT) count++;
  return count;
}

function getCategoryName(categories: SearchCategory[], categoryId?: string) {
  if (!categoryId) return '';
  return categories.find((category) => String(category.id) === String(categoryId))?.name || '';
}

export function useSearchFilters() {
  const { location, setManualLocation, clearLocation, resetToGps } = useUserLocation();
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const selectedCategoryId = typeof params.categoryId === 'string' ? params.categoryId : '';
  const [query, setQuery] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState(DEFAULT_SORT);
  const [filterOpen, setFilterOpen] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const debouncedQuery = useDebouncedValue(query);

  const filters: SearchFilters = useMemo(
    () => ({
      categoryId: selectedCategoryId,
      minRating,
      maxPrice,
      aiMode,
      sort,
      lat: location.lat,
      lng: location.lng,
    }),
    [aiMode, maxPrice, minRating, selectedCategoryId, sort, location.lat, location.lng],
  );

  const activeFilterCount = countActiveFilters(filters);

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'flat'],
    queryFn: async () => {
      const response = await serviceApi.getFlatCategories().catch(() => serviceApi.getCategories());
      return flattenCategories(normalizeList<SearchCategory>(response));
    },
    staleTime: 1000 * 60 * 10,
  });

  const isAiWaitingForKeyword = aiMode && !debouncedQuery.trim();
  const searchQuery = useInfiniteQuery({
    queryKey: [
      'services',
      'search',
      debouncedQuery,
      filters.categoryId,
      filters.minRating,
      filters.maxPrice,
      filters.sort,
      filters.aiMode,
      filters.lat,
      filters.lng,
    ],
    initialPageParam: 1,
    enabled: !isAiWaitingForKeyword,
    queryFn: async ({ pageParam }) => {
      if (filters.aiMode) {
        const response = await serviceApi.aiSearch(debouncedQuery.trim());
        return { items: normalizeList<SearchService>(response), page: 1, hasMore: false };
      }
      const response = await serviceApi.search(
        buildSearchParams({
          keyword: debouncedQuery,
          filters,
          page: Number(pageParam),
        }),
      );
      return normalizePaginated<SearchService>(response, Number(pageParam));
    },
    getNextPageParam: (lastPage) => {
      if (filters.aiMode) return undefined;
      return lastPage.hasMore ? (lastPage.page || 1) + 1 : undefined;
    },
  });

  const categories = categoriesQuery.data || [];
  const selectedCategoryName = getCategoryName(categories, selectedCategoryId);
  const services = useMemo(
    () => searchQuery.data?.pages.flatMap((page) => page.items) || [],
    [searchQuery.data],
  );
  const filtersActive = hasActiveFilters(filters);
  const isInitialLoading = searchQuery.isLoading && !searchQuery.data;

  const setCategory = (categoryId: string) => {
    Haptics.selectionAsync().catch(() => {});
    router.setParams({ categoryId });
  };

  const clearCategory = () => {
    router.setParams({ categoryId: '' });
  };

  const clearFilters = () => {
    setMinRating('');
    setMaxPrice('');
    setAiMode(false);
    setSort(DEFAULT_SORT);
    clearCategory();
    Haptics.selectionAsync().catch(() => {});
  };

  const applyFilters = () => {
    setFilterOpen(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const toggleAiMode = () => {
    setAiMode((value) => !value);
    Haptics.selectionAsync().catch(() => {});
  };

  return {
    query,
    setQuery,
    minRating,
    setMinRating,
    maxPrice,
    setMaxPrice,
    sort,
    setSort,
    filterOpen,
    setFilterOpen,
    aiMode,
    setAiMode,
    filtersActive,
    activeFilterCount,
    categories,
    selectedCategoryName,
    selectedCategoryId,
    services,
    isInitialLoading,
    isAiWaitingForKeyword,
    searchQuery,
    setCategory,
    clearCategory,
    clearFilters,
    applyFilters,
    toggleAiMode,
    categoriesQueryLoading: categoriesQuery.isLoading,
    debouncedQuery,
    location,
    setManualLocation,
    clearLocation,
    resetToGps,
  };
}
