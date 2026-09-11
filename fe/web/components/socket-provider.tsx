'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { WifiOff } from 'lucide-react';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());
  const socketsLoaded = useRef(false);
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    let active = true;

    if (isAuthenticated) {
      socketsLoaded.current = true;
      import('@/lib/socket').then(({ connectSockets, getNotifSocket }) => {
        if (!active) return;
        connectSockets();
        const socket = getNotifSocket();

        const handleConnect = () => {
          if (active) setIsReconnecting(false);
        };
        const handleDisconnect = (reason: string) => {
          if (active && reason !== 'io client disconnect') {
            setIsReconnecting(true);
          }
        };
        const handleConnectError = () => {
          if (active) setIsReconnecting(true);
        };

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('connect_error', handleConnectError);

        return () => {
          socket.off('connect', handleConnect);
          socket.off('disconnect', handleDisconnect);
          socket.off('connect_error', handleConnectError);
        };
      });
    } else if (socketsLoaded.current) {
      import('@/lib/socket').then(({ disconnectSockets }) => {
        disconnectSockets();
      });
      setIsReconnecting(false);
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

  return (
    <>
      {isReconnecting && isAuthenticated && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-0 inset-x-0 z-[9999] bg-amber-500 text-white text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center gap-2 shadow-md transition-all duration-300"
        >
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Mất kết nối với máy chủ thời gian thực. Đang tự động kết nối lại...</span>
        </div>
      )}
      {children}
    </>
  );
}
