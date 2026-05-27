import { useEffect, useState } from 'react';
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
      const token = await Notifications.getExpoPushTokenAsync();
      if (mounted) setExpoPushToken(token.data);
    }

    register().catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  return { expoPushToken };
}
