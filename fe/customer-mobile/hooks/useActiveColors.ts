import { useTheme } from 'react-native-paper';
import { Colors } from '../constants/colors';

export function useActiveColors() {
  const theme = useTheme();
  return theme.dark ? Colors.dark : Colors.light;
}
