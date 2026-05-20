'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Hiện nút khi cuộn quá 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      id="back-to-top"
      onClick={scrollToTop}
      className="fixed bottom-[calc(5rem_+_env(safe-area-inset-bottom))] right-[calc(1.25rem_+_env(safe-area-inset-right))] z-50 h-12 w-12 rounded-full border border-gray-100 bg-card p-0 text-blue-600 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-[background-color,color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-[0_8px_30px_rgb(59,130,246,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 sm:bottom-24 sm:right-7"
      aria-label="Cuộn lên đầu trang"
      title="Cuộn lên đầu trang"
    >
      <ArrowUp className="w-6 h-6" />
    </Button>
  );
}
