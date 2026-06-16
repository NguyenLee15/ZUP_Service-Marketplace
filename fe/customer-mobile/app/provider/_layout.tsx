import { Stack } from 'expo-router';
import { useStackScreenOptions } from '../../hooks/useStackScreenOptions';

export default function ProviderLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="[id]/index" options={{ title: 'Nhà cung cấp' }} />
    </Stack>
  );
}
