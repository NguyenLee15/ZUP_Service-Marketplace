import { Stack } from 'expo-router';
import { useStackScreenOptions } from '../../hooks/useStackScreenOptions';

export default function ServiceLayout() {
  const screenOptions = useStackScreenOptions();
  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="[id]/index" options={{ title: 'Chi tiết dịch vụ' }} />
    </Stack>
  );
}
