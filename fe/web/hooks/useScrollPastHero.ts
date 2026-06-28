'use client';

import { useEffect, useState } from 'react';

/**
 * Detects when user has scrolled past the Hero section.
 * Returns true when the header search bar should be visible.
 */
export function useScrollPastHero() {
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    // Hero section is ~560-640px tall, trigger at ~450px
    const THRESHOLD = 450;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setPastHero(window.scrollY > THRESHOLD);
        ticking = false;
      });
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    // Check initial position (e.g., page refresh mid-page)
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return pastHero;
}
