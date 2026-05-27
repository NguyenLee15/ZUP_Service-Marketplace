import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
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

  const bookingsQuery = useQuery({
    queryKey: ['bookings', status],
    queryFn: async () => {
      const response = await bookingApi.getMyBookings({
        status: status === 'ALL' ? undefined : status,
        page: 1,
        limit: 30,
      });
      return normalizeList<BookingListItem>(response);
    },
    staleTime: 1000 * 30, // 30s — booking status thay đổi thường xuyên
    placeholderData: keepPreviousData, // Giữ data cũ khi đổi status filter để tránh flash trắng
  });

  const bookings = useMemo(() => bookingsQuery.data || [], [bookingsQuery.data]);
  const isInitialLoading = bookingsQuery.isLoading && !bookingsQuery.data;

  const openSearch = () => router.push(routes.tabs.search);
  const refresh = () => bookingsQuery.refetch();

  return {
    status,
    setStatus,
    bookings,
    isInitialLoading,
    isRefetching: bookingsQuery.isRefetching,
    isError: bookingsQuery.isError,
    refresh,
    openSearch,
  };
}
