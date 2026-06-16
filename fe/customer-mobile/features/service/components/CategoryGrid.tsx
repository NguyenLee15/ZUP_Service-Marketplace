import { useActiveColors } from '../../../hooks/useActiveColors';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { Colors } from '../../../constants/colors';

const getStyles = (activeColors: any) => StyleSheet.create({
  section: { gap: 10 },
  horizontalList: { gap: 12, paddingRight: 16 },
  categoryCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    gap: 8,
  },
  categoryCircleIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: activeColors.primarySoft,
  },
  categoryCircleLabel: {
    color: activeColors.text,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  categorySkeletonCircle: {
    width: 80,
    alignItems: 'center',
    gap: 8,
  },
  pressed: { opacity: 0.72 },
  skeletonBlock: { backgroundColor: activeColors.surfaceVariant, borderRadius: 10 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: { color: activeColors.text, fontWeight: '900' },
  subtitle: { color: activeColors.textSecondary, lineHeight: 20 },
});

type HomeCategory = {
  id?: number | string;
  name?: string;
  icon?: string;
};

function getCategoryIcon(name?: string | null): string {
  const text = String(name || '').toLowerCase();
  if (text.includes('điện') || text.includes('nước')) return 'flash-outline';
  if (text.includes('vệ sinh') || text.includes('dọn dẹp') || text.includes('quét')) return 'broom';
  if (text.includes('điều hòa') || text.includes('lạnh') || text.includes('máy lạnh')) return 'air-conditioner';
  if (text.includes('sơn') || text.includes('vôi')) return 'format-paint';
  if (text.includes('sửa') || text.includes('bảo trì')) return 'tools';
  if (text.includes('khóa')) return 'key-outline';
  if (text.includes('vận chuyển') || text.includes('xe')) return 'truck-delivery-outline';
  return 'dots-horizontal-circle-outline';
}

function getCategoryColor(name?: string | null): string {
  const text = String(name || '').toLowerCase();
  if (text.includes('điện') || text.includes('nước')) return '#F59E0B'; // Vàng cam
  if (text.includes('vệ sinh') || text.includes('dọn dẹp')) return '#10B981'; // Xanh lá
  if (text.includes('điều hòa') || text.includes('lạnh')) return '#0B7CFF'; // Xanh dương
  if (text.includes('sơn')) return '#EC4899'; // Hồng
  if (text.includes('sửa')) return '#6366F1'; // Tím indigo
  if (text.includes('khóa')) return '#8B5CF6'; // Tím violet
  if (text.includes('vận chuyển')) return '#EF4444'; // Đỏ
  return '#64748B'; // Xám
}

export function CategoryShortcut({
  category,
  onPress,
}: {
  category: HomeCategory;
  onPress: () => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const icon = getCategoryIcon(category.name);
  const color = getCategoryColor(category.name);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Mở danh mục ${category.name || 'dịch vụ'}`}
      style={({ pressed }) => [styles.categoryCircleWrapper, pressed && styles.pressed]}
    >
      <View style={[styles.categoryCircleIcon, { backgroundColor: `${color}14` }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <Text variant="labelMedium" numberOfLines={1} style={styles.categoryCircleLabel}>
        {category.name || 'Dịch vụ'}
      </Text>
    </Pressable>
  );
}

export function CategorySection({
  categories,
  loading,
  onOpenSearch: _onOpenSearch, // ignore warning if any
  onSelect,
}: {
  categories: HomeCategory[];
  loading: boolean;
  onOpenSearch: () => void;
  onSelect: (category: HomeCategory) => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Danh mục
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            Chọn nhanh nhu cầu của bạn
          </Text>
        </View>
      </View>
      {loading ? (
        <FlatList
          horizontal
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => `category-skeleton-${item}`}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={() => (
            <View style={styles.categorySkeletonCircle}>
              <View style={[styles.skeletonBlock, { width: 56, height: 56, borderRadius: 28 }]} />
              <View style={[styles.skeletonBlock, { width: 50, height: 10 }]} />
            </View>
          )}
        />
      ) : categories.length > 0 ? (
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item, index) => String(item.id || `category-${index}`)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
          renderItem={({ item }) => (
            <CategoryShortcut category={item} onPress={() => onSelect(item)} />
          )}
        />
      ) : null}
    </View>
  );
}
