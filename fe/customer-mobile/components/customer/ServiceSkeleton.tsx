import { useActiveColors } from '../../hooks/useActiveColors';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { CustomerCard } from './CustomerCard';

const getStyles = (activeColors: any) => StyleSheet.create({
  serviceContent: { flexDirection: 'row', gap: 12 },
  serviceImage: { width: 92, height: 92, borderRadius: 14, backgroundColor: activeColors.surfaceVariant },
  skeleton: { backgroundColor: activeColors.surfaceVariant, borderRadius: 10 },
});

export function ServiceSkeleton() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <CustomerCard contentStyle={styles.serviceContent}>
      <View style={[styles.serviceImage, styles.skeleton]} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[styles.skeleton, { height: 18, width: '86%' }]} />
        <View style={[styles.skeleton, { height: 14, width: '64%' }]} />
        <View style={[styles.skeleton, { height: 14, width: '46%' }]} />
      </View>
    </CustomerCard>
  );
}
