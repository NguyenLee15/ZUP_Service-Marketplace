import { Redirect, Stack } from 'expo-router';
import { useStackScreenOptions } from '../../hooks/useStackScreenOptions';
import { useAuthStore } from '../../features/auth/auth.store';

export default function ChatRoomLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const screenOptions = useStackScreenOptions();

  // Guard: chưa xác thực → về login (tránh bypass bằng deep link)
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="[id]/index" options={{ title: 'Trò chuyện' }} />
    </Stack>
  );
}

