import { useEffect, useRef, useState } from 'react';
import type * as NotificationsModule from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';

type ExpoNotifications = typeof NotificationsModule;
type PushNotification = NotificationsModule.Notification;
type NotificationSubscription = NotificationsModule.Subscription;

const isExpoGoAndroid =
  Platform.OS === 'android' && Constants.appOwnership === 'expo';

async function loadNotifications(): Promise<ExpoNotifications | null> {
  if (isExpoGoAndroid) return null;
  return import('expo-notifications');
}

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState<
    PushNotification | undefined
  >(undefined);
  const notificationListener = useRef<NotificationSubscription | null>(null);
  const responseListener = useRef<NotificationSubscription | null>(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const Notifications = await loadNotifications();
      if (!Notifications || !mounted) return;

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      const token = await registerForPushNotificationsAsync(Notifications);
      if (token && mounted) setExpoPushToken(token);

      notificationListener.current =
        Notifications.addNotificationReceivedListener((incoming) => {
          setNotification(incoming);
        });

      responseListener.current =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data || {};
          const bookingId = data.bookingId || data.referenceId;
          if (bookingId) {
            router.push(`/booking/${bookingId}` as any);
          } else {
            router.push('/notifications' as any);
          }
        });
    };

    init();

    return () => {
      mounted = false;
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  return { expoPushToken, notification };
}

async function registerForPushNotificationsAsync(
  Notifications: ExpoNotifications,
) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007BFF',
    });
  }

  if (!Device.isDevice) return '';

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return '';

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  if (!projectId) return '';

  try {
    return (
      await Notifications.getExpoPushTokenAsync({
        projectId,
      })
    ).data;
  } catch {
    return '';
  }
}
