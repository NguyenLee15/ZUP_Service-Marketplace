/**
 * useSocket hook — quản lý kết nối chat + notification sockets
 */
import { useEffect, useRef } from 'react';
import { Alert, AppState, Vibration } from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { Socket } from 'socket.io-client';
import { getChatSocket, getNotifSocket, disconnectAll } from '../lib/socket';
import { useAuthStore } from '../features/auth/auth.store';
import { useNotificationStore } from '../features/notification/notification.store';
import { notificationApi } from '../features/notification/notification.api';

type IncomingNotification = {
  id?: number;
  type?: string;
  title?: string;
  content?: string;
  message?: string;
  referenceId?: number;
  bookingId?: number;
};

const getBookingId = (notification: IncomingNotification) =>
  notification.referenceId ?? notification.bookingId;

function showIncomingBookingAlert(notification: IncomingNotification) {
  const bookingId = getBookingId(notification);
  Vibration.vibrate([0, 250, 250, 250]);
  
  Notifications.scheduleNotificationAsync({
    content: {
      title: notification.title || 'Đơn hàng mới',
      body: notification.content || notification.message || 'Bạn vừa nhận được một đơn hàng mới.',
      sound: true,
      data: { bookingId },
    },
    trigger: null,
  });

  Alert.alert(
    notification.title || 'Đơn hàng mới',
    notification.content ||
      notification.message ||
      'Bạn vừa nhận được một đơn hàng mới.',
    [
      { text: 'Để sau', style: 'cancel' },
      {
        text: 'Xem đơn',
        onPress: () => {
          if (bookingId) router.push(`/booking/${bookingId}` as any);
        },
      },
    ],
  );
}

export const useSocket = () => {
  const { isAuthenticated } = useAuthStore();
  const { setUnreadCount, increment, signalBookingChanged } =
    useNotificationStore();
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

        notifSocket.off('new_notification');
        notifSocket.on(
          'new_notification',
          (notification: IncomingNotification) => {
            if (mounted) increment();
            const bookingId = getBookingId(notification);
            if (bookingId) signalBookingChanged(Number(bookingId));
            if (notification?.type === 'NEW_BOOKING') {
              showIncomingBookingAlert(notification);
            }
            if (notification?.type === 'KYC_RESULT' || notification?.type === 'SERVICE_APPROVED') {
              useAuthStore.getState().fetchProfile();
            }
          },
        );
      } catch {}
    };

    connect();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && notifSocketRef.current) {
        if (!notifSocketRef.current.connected) {
          notifSocketRef.current.connect();
        }
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
      disconnectAll();
    };
  }, [isAuthenticated]);
};
