import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { unwrapData } from '../lib/api-response';
import {
  FALLBACK_ADDRESS_OPTIONS,
  normalizeAddressOptions,
} from '../lib/address-options';

export function useAddressOptions() {
  const query = useQuery({
    queryKey: ['address-options'],
    queryFn: async () => {
      try {
        const response = await fetch('https://provinces.open-api.vn/api/?depth=3');
        const data = await response.json();
        return normalizeAddressOptions(data);
      } catch (e) {
        return FALLBACK_ADDRESS_OPTIONS;
      }
    },
    staleTime: 1000 * 60 * 60 * 24,
    retry: 1,
  });

  return {
    addressOptions: query.data || FALLBACK_ADDRESS_OPTIONS,
    loading: query.isLoading,
    fallback: query.isError,
  };
}
