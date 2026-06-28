'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const socketsLoaded = useRef(false);

  useEffect(() => {
    let active = true;

    if (isAuthenticated) {
      socketsLoaded.current = true;
      import('@/lib/socket').then(({ connectSockets }) => {
        if (active) connectSockets();
      });
    } else if (socketsLoaded.current) {
      import('@/lib/socket').then(({ disconnectSockets }) => {
        disconnectSockets();
      });
    }

    return () => {
      active = false;
      if (socketsLoaded.current) {
        import('@/lib/socket').then(({ disconnectSockets }) => {
          disconnectSockets();
        });
      }
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
