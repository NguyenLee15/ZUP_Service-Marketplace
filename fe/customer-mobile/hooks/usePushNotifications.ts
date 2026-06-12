import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function register() {
      if (!Device.isDevice) return;
      const current = await Notifications.getPermissionsAsync();
      const finalStatus =
        current.status === 'granted'
          ? current.status
          : (await Notifications.requestPermissionsAsync()).status;
      if (finalStatus !== 'granted') return;
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ||
        Constants.easConfig?.projectId;
      const token = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined,
      );
      if (mounted) setExpoPushToken(token.data);
    }

    register().catch((error) => {
      if (__DEV__) console.warn('Failed to register push notifications:', error);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { expoPushToken };
}
