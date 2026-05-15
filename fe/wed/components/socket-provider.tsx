'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { connectSockets, disconnectSockets } from '@/lib/socket';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  useEffect(() => {
    if (isAuthenticated) {
      connectSockets();
    } else {
      disconnectSockets();
    }

    return () => {
      disconnectSockets();
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
