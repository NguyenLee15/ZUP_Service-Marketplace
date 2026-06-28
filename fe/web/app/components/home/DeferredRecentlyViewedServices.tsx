'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';

type RecentlyViewedComponent = ComponentType<Record<string, never>>;

export function DeferredRecentlyViewedServices() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [Component, setComponent] = useState<RecentlyViewedComponent | null>(null);

  useEffect(() => {
    if (Component) return;

    const target = ref.current;
    if (!target) return;

    let cancelled = false;

    const load = () => {
      void import('@/app/components/home/RecentlyViewedServices').then((mod) => {
        if (!cancelled) setComponent(() => mod.RecentlyViewedServices);
      });
    };

    if (!('IntersectionObserver' in window)) {
      load();
      return () => {
        cancelled = true;
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        load();
      },
      { rootMargin: '480px 0px' },
    );

    observer.observe(target);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [Component]);

  return <div ref={ref}>{Component ? <Component /> : null}</div>;
}
