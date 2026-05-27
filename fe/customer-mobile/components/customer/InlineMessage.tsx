import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Tone = 'info' | 'success' | 'warning' | 'error' | 'neutral';

const toneIcon: Record<Tone, IconName> = {
  info: 'information-outline',
  success: 'check-circle-outline',
  warning: 'alert-outline',
  error: 'alert-circle-outline',
  neutral: 'information-outline',
};

const styles = StyleSheet.create({
  message: { flexDirection: 'row', gap: 8, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'flex-start' },
  messageText: { flex: 1, fontWeight: '600', lineHeight: 18 },
});

export function InlineMessage({
  message,
  tone = 'info',
}: {
  message: string;
  tone?: Tone;
}) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  const color = {
    info: activeColors.info,
    success: activeColors.success,
    warning: activeColors.warning,
    error: activeColors.error,
    neutral: activeColors.textSecondary,
  }[tone];

  return (
    <View style={[styles.message, { backgroundColor: `${color}12`, borderColor: `${color}33` }]}>
      <MaterialCommunityIcons name={toneIcon[tone]} size={18} color={color} />
      <Text variant="bodySmall" style={[styles.messageText, { color }]}>
        {message}
      </Text>
    </View>
  );
}

