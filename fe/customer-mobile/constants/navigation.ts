import { Colors } from './colors';

export const stackScreenOptions = {
  headerBackTitle: 'Quay lại',
  headerStyle: {
    backgroundColor: Colors.light.surface,
  },
  headerShadowVisible: false,
  headerTintColor: Colors.light.text,
  headerTitleAlign: 'center' as const,
  headerTitleStyle: {
    color: Colors.light.text,
    fontSize: 17,
    fontWeight: '800' as const,
  },
  contentStyle: {
    backgroundColor: Colors.light.background,
  },
};

export const tabLabelStyle = {
  fontSize: 10.5,
  fontWeight: '700' as const,
};
