'use client';

import { useEffect, useRef, useCallback } from 'react';
import { getNotifSocket, connectSockets, disconnectSockets } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import type { Socket } from 'socket.io-client';

/**
 * Global socket hook — connect/disconnect/emit/on wrapper.
 * Auto-connect khi user đăng nhập, auto-disconnect khi logout.
 */
export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (accessToken) {
      connectSockets();
      socketRef.current = getNotifSocket();
    } else {
      disconnectSockets();
      socketRef.current = null;
    }

    return () => {
      // Không disconnect khi unmount component — socket là singleton
    };
  }, [accessToken]);

  const emit = useCallback((event: string, data?: unknown) => {
    socketRef.current?.emit(event, data);
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  const off = useCallback((event: string, handler?: (...args: unknown[]) => void) => {
    if (handler) {
      socketRef.current?.off(event, handler);
    } else {
      socketRef.current?.removeAllListeners(event);
    }
  }, []);

  return {
    socket: socketRef.current,
    emit,
    on,
    off,
    isConnected: socketRef.current?.connected ?? false,
  };
}
