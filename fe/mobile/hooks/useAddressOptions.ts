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
      const response = await api.get('/address-options');
      return normalizeAddressOptions(unwrapData(response));
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
