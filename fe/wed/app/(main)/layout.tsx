'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { CustomerFooter } from '@/components/layout/CustomerFooter';
import { BackButton } from '@/components/navigation/BackButton';

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const mainBackRouteMap: Record<string, string> = {
    '/bookings/create': '/services',
    '/profile/addresses': '/profile',
    '/services/compare': '/services',
  };
  const fallbackHref = mainBackRouteMap[pathname];
  const showBackButton = Boolean(fallbackHref);

  return (
    <div className="themed-shell min-h-screen bg-background flex flex-col">
      <CustomerHeader />

      {/* Main Content */}
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {showBackButton && (
          <BackButton fallbackHref={fallbackHref} className="mb-4" />
        )}
        {children}
      </main>

      <CustomerFooter />
    </div>
  );
}
