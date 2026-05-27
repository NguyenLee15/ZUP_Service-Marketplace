import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { CustomerCard } from './CustomerCard';

const styles = StyleSheet.create({
  serviceContent: { flexDirection: 'row', gap: 12 },
  serviceImage: { width: 92, height: 92, borderRadius: 14, backgroundColor: Colors.light.surfaceVariant },
  skeleton: { backgroundColor: Colors.light.surfaceVariant, borderRadius: 10 },
});

export function ServiceSkeleton() {
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
