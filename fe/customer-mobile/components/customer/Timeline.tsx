import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDateTime } from '../../lib/format';
import { CustomerCard } from './CustomerCard';

const styles = StyleSheet.create({
  subtitle: { lineHeight: 20 },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});

function ActiveDot() {
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const theme = useTheme();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.5,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View style={[styles.timelineDot, { backgroundColor: theme.colors.primary, opacity: pulseAnim }]}>
      <MaterialCommunityIcons name="circle" size={8} color="#FFFFFF" />
    </Animated.View>
  );
}

export function Timeline({
  status,
  steps,
}: {
  status?: string;
  steps: Array<{ key: string; label: string; description?: string; at?: string | null }>;
}) {
  const activeIndex = Math.max(0, steps.findIndex((step) => step.key === status));
  const theme = useTheme();

  return (
    <CustomerCard>
      <View style={{ gap: 14 }}>
        {steps.map((step, index) => {
          const done = index <= activeIndex;
          const isActive = index === activeIndex;
          return (
            <View key={step.key} style={{ flexDirection: 'row', gap: 12 }}>
              {isActive ? (
                <ActiveDot />
              ) : (
                <View style={[styles.timelineDot, { backgroundColor: done ? (theme.dark ? 'rgba(59, 130, 246, 0.15)' : '#E8F3FF') : theme.colors.outline }]}>
                  {done ? <MaterialCommunityIcons name="check" size={12} color={theme.colors.primary} /> : null}
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text variant="titleSmall" style={{ color: isActive ? theme.colors.primary : done ? theme.colors.onSurface : theme.colors.onSurfaceVariant, fontWeight: isActive ? '900' : '800' }}>
                  {step.label}
                </Text>
                {step.description || step.at ? (
                  <Text variant="bodySmall" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
                    {step.description || formatDateTime(step.at)}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </CustomerCard>
  );
}


