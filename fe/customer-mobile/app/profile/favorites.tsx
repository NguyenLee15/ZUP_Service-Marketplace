import { useActiveColors } from '../../hooks/useActiveColors';
import { StyleSheet, View, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmptyState, ServiceCard } from '../../components/customer/customer-ui';
import { useServiceStore } from '../../features/service/service.store';
import { stableKey, toRouteId, routes } from '../../lib/route-utils';

export default function FavoritesScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const router = useRouter();
  const { favoriteServices, toggleFavorite } = useServiceStore();

  return (
    <View style={styles.screen}>
      {favoriteServices.length === 0 ? (
        <EmptyState
          icon="heart-outline"
          title="Chưa có dịch vụ yêu thích"
          description="Bạn chưa lưu dịch vụ nào. Hãy khám phá và lưu lại các dịch vụ ưng ý nhé!"
          actionLabel="Khám phá ngay"
          onAction={() => {
            Haptics.selectionAsync().catch(() => {});
            router.replace(routes.tabs.search);
          }}
        />
      ) : (
        <FlashList
          data={favoriteServices}
          keyExtractor={(item, index) => stableKey(item.id, `fav-${index}`)}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ServiceCard
                service={item as any}
                onPress={() => {
                  const routeId = toRouteId(item.id);
                  if (routeId) {
                    Haptics.selectionAsync().catch(() => {});
                    router.push(routes.service(routeId));
                  }
                }}
              />
              <Pressable
                style={styles.removeBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  toggleFavorite(item);
                }}
                accessibilityRole="button"
                accessibilityLabel="Bỏ yêu thích"
              >
                <MaterialCommunityIcons name="heart-broken" size={20} color={activeColors.error} />
              </Pressable>
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: activeColors.background },
  listContent: { padding: 16, paddingBottom: 40 },
  cardWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
