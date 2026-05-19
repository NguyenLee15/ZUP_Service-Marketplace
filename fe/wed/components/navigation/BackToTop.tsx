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
      className="fixed bottom-6 right-32 sm:bottom-8 sm:right-36 z-50 rounded-full w-12 h-12 p-0 shadow-[0_8px_30px_rgb(0,0,0,0.12)] bg-card text-blue-600 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-400 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700 transition-[background-color,color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(59,130,246,0.3)] animate-in fade-in slide-in-from-bottom-4"
      aria-label="Cuộn lên đầu trang"
      title="Cuộn lên đầu trang"
    >
      <ArrowUp className="w-6 h-6" />
    </Button>
  );
}
