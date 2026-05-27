import { Stack } from 'expo-router';
import { stackScreenOptions } from '../../constants/navigation';

export default function ProviderLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="[id]/index" options={{ title: 'Nhà cung cấp' }} />
    </Stack>
  );
}
