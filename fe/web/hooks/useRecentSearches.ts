'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'zup.recent-searches.v1';
const MAX_ITEMS = 5;

export function useRecentSearches() {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (Array.isArray(stored)) setItems(stored.filter((item): item is string => typeof item === 'string').slice(0, MAX_ITEMS));
    } catch {
      setItems([]);
    }
  }, []);

  const addSearch = useCallback((value: string) => {
    const normalized = value.trim().slice(0, 100);
    if (!normalized) return;
    setItems((current) => {
      const next = [normalized, ...current.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, MAX_ITEMS);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { recentSearches: items, addSearch };
}
