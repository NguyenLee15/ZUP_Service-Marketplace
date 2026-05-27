import { Stack } from 'expo-router';
import { stackScreenOptions } from '../../constants/navigation';

export default function ServiceLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="[id]/index" options={{ title: 'Chi tiết dịch vụ' }} />
    </Stack>
  );
}
