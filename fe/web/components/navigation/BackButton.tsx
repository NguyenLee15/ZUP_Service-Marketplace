'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type BackButtonProps = {
  fallbackHref?: string;
  label?: string;
  ariaLabel?: string;
  variant?: 'subtle' | 'button';
  className?: string;
};

export function BackButton({
  fallbackHref = '/',
  label = 'Quay lại',
  ariaLabel,
  variant = 'subtle',
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window === 'undefined') return;

    const historyState = window.history.state as { idx?: number } | null;
    const hasIndexedHistory = typeof historyState?.idx === 'number' && historyState.idx > 0;
    let hasSameOriginReferrer = false;

    if (document.referrer) {
      try {
        hasSameOriginReferrer = new URL(document.referrer).origin === window.location.origin;
      } catch {
        hasSameOriginReferrer = false;
      }
    }

    if (window.history.length > 1 && (hasIndexedHistory || hasSameOriginReferrer)) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label={ariaLabel || label}
      className={cn(
        'group inline-flex items-center gap-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        variant === 'subtle'
          ? 'text-muted-foreground dark:text-muted-foreground hover:text-blue-600 dark:hover:text-blue-300'
          : 'border border-border bg-background px-5 py-3 font-bold text-foreground shadow-sm hover:bg-muted',
        className,
      )}
    >
      <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      <span className="font-medium">{label}</span>
    </button>
  );
}
