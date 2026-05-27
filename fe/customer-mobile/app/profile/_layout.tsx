import { Stack } from 'expo-router';
import { stackScreenOptions } from '../../constants/navigation';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="edit" options={{ title: 'Cập nhật hồ sơ' }} />
      <Stack.Screen name="addresses" options={{ title: 'Địa chỉ' }} />
      <Stack.Screen name="change-password" options={{ title: 'Đổi mật khẩu' }} />
    </Stack>
  );
}
