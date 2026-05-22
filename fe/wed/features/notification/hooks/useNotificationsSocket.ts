import { useEffect, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { ensureAccessToken } from '@/lib/auth-token';
import { useAuthStore } from '@/store/auth.store';

type NotificationPayload = {
  title?: string;
  content?: string;
  [key: string]: unknown;
};

export const useNotificationsSocket = (onNotificationReceived: (notification: NotificationPayload) => void) => {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    let socket: Socket | null = null;

    async function connect() {
      const token = accessToken || (await ensureAccessToken());
      if (!token) return;

      const { io } = await import('socket.io-client');
      if (cancelled) return;

      // WebSocket kết nối trực tiếp tới BE — không qua BFF proxy
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
      const baseUrl = wsUrl.replace(/\/api\/?$/, '');

      socket = io(`${baseUrl}/notifications`, {
        auth: { token },
        // Allow both polling and websocket for better compatibility
      });

      socket.on('new_notification', (notification) => {
        onNotificationReceived(notification);
      });

      socketRef.current = socket;
    }

    void connect();

    return () => {
      cancelled = true;
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user, onNotificationReceived]);

  return socketRef.current;
};
