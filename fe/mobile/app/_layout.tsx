/**
 * Root Layout — Auth gate + theme provider + socket init + QueryClient + Offline banner
 */
import { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, useColorScheme, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme, MD3LightTheme, Text, useTheme } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '../features/auth/auth.store';
import { useSocket } from '../hooks/useSocket';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { authApi } from '../features/auth/auth.api';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Colors } from '../constants/colors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 3, // 3 phút
      gcTime: 1000 * 60 * 20,    // 20 phút
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
    },
  },
});

export default function RootLayout() {
  const { isAuthenticated, isLoading, loadFromStorage } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Khôi phục session khi app khởi động
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Sockets & Push Notifications
  useSocket();
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
  }, [isAuthenticated, isLoading, router, segments]);

  const inAuthGroup = segments[0] === '(auth)';
  const shouldHoldRoute =
    isLoading ||
    (!isAuthenticated && !inAuthGroup) ||
    (isAuthenticated && inAuthGroup);

  const activeColors = isDark ? Colors.dark : Colors.light;

  const theme = {
    ...(isDark ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(isDark ? MD3DarkTheme.colors : MD3LightTheme.colors),
      primary: activeColors.primary,
      secondary: activeColors.secondary,
      background: activeColors.background,
      surface: activeColors.surface,
      surfaceVariant: activeColors.surfaceVariant,
      outline: activeColors.borderStrong,
      outlineVariant: activeColors.border,
      onSurface: activeColors.text,
      onSurfaceVariant: activeColors.textSecondary,
      error: activeColors.error,
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <View style={[styles.appShell, { backgroundColor: theme.colors.background }]}>
            {shouldHoldRoute ? <AppBootScreen /> : <Slot />}
            <OfflineBanner visible={isOnline === false} />
          </View>
        </PaperProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function AppBootScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.bootScreen, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.bootMark, { backgroundColor: theme.colors.primary }]}>
        <Text style={styles.bootInitial}>Z</Text>
      </View>
      <Text style={[styles.bootTitle, { color: theme.colors.onSurface }]}>Zup Đối Tác</Text>
      <Text style={[styles.bootSubtitle, { color: theme.colors.onSurfaceVariant }]}>Đang khởi tạo cấu hình thợ</Text>
      <ActivityIndicator color={theme.colors.primary} style={styles.bootSpinner} />
    </View>
  );
}

function OfflineBanner({ visible }: { visible: boolean }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? Math.max(insets.top, 10) : -150,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [visible, insets.top]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.offlineBanner,
        {
          top: 0,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.offlineText}>Đang ngoại tuyến. Một số tính năng sẽ bị tạm khóa.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
  },
  bootScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  bootMark: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bootInitial: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  bootTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  bootSubtitle: {
    marginTop: 6,
  },
  bootSpinner: {
    marginTop: 18,
  },
  offlineBanner: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.light.warning,
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
