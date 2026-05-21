/**
 * Root Layout — Auth gate + theme provider + socket init
 */
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { useAuthStore } from '../features/auth/auth.store';
import { useSocket } from '../hooks/useSocket';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { authApi } from '../features/auth/auth.api';
import { Colors } from '../constants/colors';

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadFromStorage } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Khôi phục session khi app khởi động
  useEffect(() => { loadFromStorage(); }, []);

  // Kết nối sockets khi authenticated
  useSocket();

  // Đăng ký Push Notification
  const { expoPushToken } = usePushNotifications();

  useEffect(() => {
    if (isAuthenticated && expoPushToken) {
      authApi.updatePushToken(expoPushToken).catch(() => {});
    }
  }, [isAuthenticated, expoPushToken]);

  // Auth redirect logic
  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  const theme = {
    ...MD3LightTheme,
    colors: {
      ...MD3LightTheme.colors,
      primary: Colors.light.primary,
      secondary: Colors.light.secondary,
      background: Colors.light.background,
      surface: Colors.light.surface,
      surfaceVariant: Colors.light.surfaceVariant,
      outline: Colors.light.borderStrong,
      outlineVariant: Colors.light.border,
      onSurface: Colors.light.text,
      onSurfaceVariant: Colors.light.textSecondary,
      error: Colors.light.error,
    },
  };

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="dark" />
      <Slot />
    </PaperProvider>
  );
}
