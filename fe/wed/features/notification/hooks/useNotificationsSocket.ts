import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth.store';

export const useNotificationsSocket = (onNotificationReceived: (notification: any) => void) => {
  const socketRef = useRef<Socket | null>(null);
  const { accessToken, user } = useAuthStore();

  useEffect(() => {
    if (!accessToken || !user) return;

    // WebSocket kết nối trực tiếp tới BE — không qua BFF proxy
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';
    const baseUrl = wsUrl.replace(/\/api\/?$/, '');

    const socket = io(`${baseUrl}/notifications`, {
      auth: { token: accessToken },
      // Allow both polling and websocket for better compatibility
    });

    socket.on('new_notification', (notification) => {
      onNotificationReceived(notification);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, user, onNotificationReceived]);

  return socketRef.current;
};
