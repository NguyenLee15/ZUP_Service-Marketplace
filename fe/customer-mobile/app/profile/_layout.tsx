import { Stack } from 'expo-router';
import { useStackScreenOptions } from '../../hooks/useStackScreenOptions';

export default function ProfileLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="edit" options={{ title: 'Cập nhật hồ sơ' }} />
      <Stack.Screen name="addresses" options={{ title: 'Địa chỉ' }} />
      <Stack.Screen name="change-password" options={{ title: 'Đổi mật khẩu' }} />
    </Stack>
  );
}
