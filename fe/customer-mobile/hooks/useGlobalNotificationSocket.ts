import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../features/auth/auth.store';
import { WS_URL } from '../constants/api';
import { storage } from '../lib/storage';

export function useGlobalNotificationSocket(
  onNotification?: (notification: any) => void
) {
  const { isAuthenticated } = useAuthStore();
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function initSocket() {
      const accessToken = await storage.getAccessToken();
      if (!accessToken || cancelled) return;

      let socket = socketRef.current;
      if (!socket) {
        socket = io(`${WS_URL}/notifications`, {
          transports: ['websocket'],
          auth: { token: accessToken },
        });
        socketRef.current = socket;
      }

      const handleNewNotification = (notification: any) => {
        if (onNotification) {
          onNotification(notification);
        }
      };

      socket.on('new_notification', handleNewNotification);

      return handleNewNotification;
    }

    let cleanupHandler: any = null;
    initSocket().then(handler => {
      cleanupHandler = handler;
    });

    return () => {
      cancelled = true;
      if (socketRef.current && cleanupHandler) {
        socketRef.current.off('new_notification', cleanupHandler);
      }
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, onNotification]);

  return socketRef.current;
}
