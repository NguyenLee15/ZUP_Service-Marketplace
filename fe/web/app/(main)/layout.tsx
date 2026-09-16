'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CustomerHeader } from '@/components/layout/CustomerHeader';
import { CustomerFooter } from '@/components/layout/CustomerFooter';
import { BackButton } from '@/components/navigation/BackButton';
import { SocketProvider } from '@/components/socket-provider';
import { Toaster } from '@/components/ui/sonner';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    const customerProtectedPrefixes = [
      '/bookings',
      '/profile',
      '/chat',
      '/favorites',
      '/notifications',
      '/payment',
    ];
    const isProtected = customerProtectedPrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(prefix + '/'),
    );

    if (user && (user.role === Role.ADMIN || user.role === Role.STAFF)) {
      if (isProtected) {
        router.replace('/admin/dashboard');
      }
    } else if (!user && isProtected) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [_hasHydrated, user, pathname, router]);
  const mainBackRouteMap: Record<string, string> = {
    '/bookings/create': '/services',
    '/profile/addresses': '/profile',
    '/services/compare': '/services',
  };
  const fallbackHref = mainBackRouteMap[pathname];
  const showBackButton = Boolean(fallbackHref);

  return (
    <SocketProvider>
      <div className="min-h-[100dvh] bg-background flex flex-col">
        <CustomerHeader />

        {/* Main Content */}
        <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-4">
            <Breadcrumbs />
          </div>
          {showBackButton && (
            <BackButton fallbackHref={fallbackHref} className="mb-4" />
          )}
          {children}
        </main>

        <CustomerFooter />
        <Toaster position="bottom-right" richColors />
      </div>
    </SocketProvider>
  );
}
