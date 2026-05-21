'use client';

import { useEffect, useState } from 'react';
import {
  FALLBACK_ADDRESS_OPTIONS,
  normalizeAddressOptions,
  type ProvinceOption,
} from '@/lib/address-options';

interface AddressOptionsResponse {
  data?: unknown;
  fallback?: boolean;
}

export function useAddressOptions() {
  const [addressOptions, setAddressOptions] = useState<ProvinceOption[]>(FALLBACK_ADDRESS_OPTIONS);
  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/address-options')
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load address options');
        return response.json() as Promise<AddressOptionsResponse>;
      })
      .then((payload) => {
        if (cancelled) return;
        setAddressOptions(normalizeAddressOptions(payload.data));
        setFallback(Boolean(payload.fallback));
      })
      .catch(() => {
        if (!cancelled) {
          setAddressOptions(FALLBACK_ADDRESS_OPTIONS);
          setFallback(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    addressOptions,
    loading,
    fallback,
  };
}
