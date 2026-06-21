export interface PaginatedResult<T> {
  items: T[];
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

export function unwrapData<T = unknown>(payload: any): T {
  return (payload?.data?.data ?? payload?.data ?? payload) as T;
}

export function normalizeList<T = any>(payload: any): T[] {
  const data = unwrapData<any>(payload);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export function normalizePaginated<T = any>(payload: any, fallbackPage = 1): PaginatedResult<T> {
  const data = unwrapData<any>(payload);
  const items = normalizeList<T>(payload);
  const total = Number(data?.total ?? data?.meta?.total ?? items.length);
  const page = Number(data?.page ?? data?.meta?.page ?? fallbackPage);
  const limit = Number(data?.limit ?? data?.meta?.limit ?? (items.length || 10));
  return {
    items,
    total,
    page,
    limit,
    hasMore: page * limit < total,
  };
}

export function getApiErrorMessage(error: any, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}
