import { useTheme } from 'react-native-paper';
import { Colors } from '../constants/colors';

export function useStackScreenOptions() {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  return {
    headerBackTitle: 'Quay lại',
    headerStyle: {
      backgroundColor: activeColors.surface,
    },
    headerShadowVisible: false,
    headerTintColor: activeColors.text,
    headerTitleAlign: 'center' as const,
    headerTitleStyle: {
      color: activeColors.text,
      fontSize: 17,
      fontWeight: '800' as const,
    },
    contentStyle: {
      backgroundColor: activeColors.background,
    },
  };
}
