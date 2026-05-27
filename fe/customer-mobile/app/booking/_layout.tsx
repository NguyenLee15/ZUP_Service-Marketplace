import { Redirect, Stack } from 'expo-router';
import { stackScreenOptions } from '../../constants/navigation';
import { useAuthStore } from '../../features/auth/auth.store';

export default function BookingLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Guard: chưa xác thực → về login (tránh bypass bằng deep link)
  if (!isLoading && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="create" options={{ title: 'Đặt dịch vụ' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Chi tiết đơn' }} />
      <Stack.Screen name="[id]/review" options={{ title: 'Đánh giá' }} />
      <Stack.Screen name="[id]/dispute" options={{ title: 'Tranh chấp', presentation: 'modal' }} />
      <Stack.Screen name="[id]/track" options={{ title: 'Theo dõi đơn' }} />
    </Stack>
  );
}
