import { useMemo, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { bookingApi } from '../booking.api';
import { routes } from '../../../lib/route-utils';
import { normalizeList } from '../../../lib/api-response';

export type BookingListItem = {
  id?: number | string;
  bookingCode?: string | null;
  status?: string | null;
  service?: { name?: string | null } | null;
  provider?: { fullName?: string | null } | null;
  desiredTime?: string | Date | null;
  province?: string | null;
  ward?: string | null;
  addressDetail?: string | null;
  quoteAmount?: number | string | null;
  actualPrice?: number | string | null;
};

export function useBookingsList() {
  const router = useRouter();
  const [status, setStatus] = useState('ALL');

  const bookingsQuery = useInfiniteQuery({
    queryKey: ['bookings', status],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const response = await bookingApi.getMyBookings({
        status: status === 'ALL' ? undefined : status,
        page: pageParam,
        limit: 20,
      });
      const items = normalizeList<BookingListItem>(response);
      const meta = (response.data as any)?.meta as
        | { totalPages?: number; page?: number }
        | undefined;
      return {
        items,
        page: pageParam as number,
        totalPages: meta?.totalPages ?? 1,
      };
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 1000 * 30, // 30s
  });

  const bookings = useMemo(
    () => bookingsQuery.data?.pages.flatMap((page) => page.items) || [],
    [bookingsQuery.data],
  );

  const isInitialLoading = bookingsQuery.isLoading && !bookingsQuery.data;
  const openSearch = () => router.push(routes.tabs.search);
  const refresh = () => bookingsQuery.refetch();
  const loadMore = () => {
    if (bookingsQuery.hasNextPage && !bookingsQuery.isFetchingNextPage) {
      bookingsQuery.fetchNextPage();
    }
  };

  return {
    status,
    setStatus,
    bookings,
    isInitialLoading,
    isRefetching: bookingsQuery.isRefetching,
    isFetchingNextPage: bookingsQuery.isFetchingNextPage,
    hasNextPage: Boolean(bookingsQuery.hasNextPage),
    isError: bookingsQuery.isError,
    loadMore,
    refresh,
    openSearch,
  };
}
