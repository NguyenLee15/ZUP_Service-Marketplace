import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, Text } from 'react-native-paper';
import { Colors } from '../../../constants/colors';

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: 16,
    borderWidth: 1,
    boxShadow: Colors.light.cardShadow,
  },
  cardContent: { padding: 16 },
  serviceContent: { flexDirection: 'row', gap: 12 },
  serviceImage: { width: 92, height: 92, borderRadius: 14, backgroundColor: Colors.light.surfaceVariant },
  imageFallback: {
    width: 92,
    height: 92,
    borderRadius: 14,
    backgroundColor: Colors.light.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTitle: { color: Colors.light.text, fontWeight: '800' },
  subtitle: { color: Colors.light.textSecondary, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: Colors.light.textSecondary, fontWeight: '700' },
  price: { color: Colors.light.primary, fontWeight: '900' },
  dividerDot: { color: Colors.light.textSecondary, marginHorizontal: 2 },
});

export function ServiceCard({ service, onPress }: { service: any; onPress: () => void }) {
  const imageUrl = service?.images?.[0]?.imageUrl;
  const price = Number(service?.referencePrice || 0);
  
  const distance = service?.distanceKm ?? service?.distance;

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`Mở dịch vụ ${service?.name || 'dịch vụ'}`}
      accessibilityHint="Mở màn hình chi tiết dịch vụ"
      hitSlop={6}
    >
      <Card mode="contained" style={styles.card}>
        <Card.Content style={[styles.cardContent, styles.serviceContent]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.serviceImage} contentFit="cover" transition={180} />
          ) : (
            <View style={styles.imageFallback}>
              <MaterialCommunityIcons name="tools" size={28} color={Colors.light.primary} />
            </View>
          )}
          <View style={{ flex: 1, gap: 4 }}>
            <Text variant="titleMedium" style={styles.serviceTitle} numberOfLines={2}>
              {service?.name || 'Dịch vụ'}
            </Text>
            <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>
              {service?.provider?.fullName || service?.category?.name || 'Zup'}
            </Text>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="star" size={15} color="#FBBF24" />
              <Text variant="labelSmall" style={styles.metaText}>
                {Number(service?.avgRating || 0).toFixed(1)} ({service?.totalReviews || 0})
              </Text>
              {distance !== undefined && (
                <>
                  <Text style={styles.dividerDot}>•</Text>
                  <MaterialCommunityIcons name="map-marker-outline" size={14} color={Colors.light.textSecondary} />
                  <Text variant="labelSmall" style={styles.metaText}>
                    {distance.toFixed(1)} km
                  </Text>
                </>
              )}
            </View>
            <Text variant="titleSmall" style={styles.price}>
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );
}
