/**
 * useSocket hook — quản lý kết nối chat + notification sockets
 */
import { useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { getChatSocket, getNotifSocket, disconnectAll } from '../lib/socket';
import { useAuthStore } from '../features/auth/auth.store';
import { useNotificationStore } from '../features/notification/notification.store';
import { notificationApi } from '../features/notification/notification.api';

export const useSocket = () => {
  const { isAuthenticated } = useAuthStore();
  const { setUnreadCount, increment } = useNotificationStore();
  const notifSocketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectAll();
      return;
    }

    let mounted = true;

    const connect = async () => {
      try {
        // Lấy unread count ban đầu
        const res = await notificationApi.getUnreadCount().catch(() => null);
        if (res?.data?.data && mounted) {
          setUnreadCount(res.data.data.count || 0);
        }

        // Kết nối notification socket
        const notifSocket = await getNotifSocket();
        notifSocketRef.current = notifSocket;

        notifSocket.on('new_notification', () => {
          if (mounted) increment();
        });
      } catch {}
    };

    connect();

    return () => {
      mounted = false;
      disconnectAll();
    };
  }, [isAuthenticated]);
};
