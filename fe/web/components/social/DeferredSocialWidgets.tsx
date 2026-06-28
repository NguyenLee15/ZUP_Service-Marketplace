'use client';

import { useEffect, useRef, useState, type ComponentType } from 'react';

type SocialComponent = ComponentType<Record<string, never>>;
type SocialExport = 'FooterSocialLinks' | 'SocialFeedSection';

function useDeferredSocialComponent(exportName: SocialExport) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [Component, setComponent] = useState<SocialComponent | null>(null);

  useEffect(() => {
    if (Component) return;

    const target = ref.current;
    if (!target) return;

    let cancelled = false;

    const load = () => {
      void import('@/components/social/SocialWidgets').then((mod) => {
        if (!cancelled) setComponent(() => mod[exportName]);
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
      { rootMargin: '240px 0px' },
    );

    observer.observe(target);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [Component, exportName]);

  return { Component, ref };
}

export function DeferredFooterSocialLinks() {
  const { Component, ref } = useDeferredSocialComponent('FooterSocialLinks');

  return <div ref={ref}>{Component ? <Component /> : null}</div>;
}

export function DeferredSocialFeedSection() {
  const { Component, ref } = useDeferredSocialComponent('SocialFeedSection');

  return <div ref={ref}>{Component ? <Component /> : null}</div>;
}
