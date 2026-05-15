import { Stack } from 'expo-router';

export default function ChatRoomLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />;
}
