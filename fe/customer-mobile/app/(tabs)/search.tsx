import { useMemo } from 'react';
import { StyleSheet, View, ScrollView, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Button, Chip, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  ConfirmSheet,
  CustomerHeader,
  EmptyState,
  InlineMessage,
  ServiceCard,
  ServiceSkeleton,
} from '../../components/customer/customer-ui';
import { Colors } from '../../constants/colors';
import { stableKey, toRouteId, routes } from '../../lib/route-utils';
import { useSearchFilters, SearchService, SearchCategory } from '../../features/service/hooks/useSearchFilters';

const SORT_PRESETS = [
  { label: 'Đánh giá cao', value: 'rating' },
  { label: 'Phổ biến nhất', value: 'popular' },
  { label: 'Giá thấp nhất', value: 'price' },
  { label: 'Mới nhất', value: 'newest' },
];

const DEFAULT_SORT = 'rating';
const RATING_PRESETS = ['4.5', '4.0', '3.5'];
const PRICE_PRESETS = [
  { label: '200k', value: '200000' },
  { label: '500k', value: '500000' },
  { label: '1tr', value: '1000000' },
  { label: '2tr', value: '2000000' },
];

function sanitizePrice(value: string) {
  return value.replace(/\D/g, '');
}

function formatPrice(value?: string) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function SearchScreen() {
  const router = useRouter();
  const {
    query,
    setQuery,
    minRating,
    setMinRating,
    maxPrice,
    setMaxPrice,
    sort,
    setSort,
    filterOpen,
    setFilterOpen,
    aiMode,
    setAiMode,
    filtersActive,
    activeFilterCount,
    categories,
    selectedCategoryName,
    selectedCategoryId,
    services,
    isInitialLoading,
    isAiWaitingForKeyword,
    searchQuery,
    setCategory,
    clearCategory,
    clearFilters,
    applyFilters,
    toggleAiMode,
    categoriesQueryLoading,
    debouncedQuery,
  } = useSearchFilters();

  const skeletonRows = useMemo(
    () => [{ id: 's1' }, { id: 's2' }, { id: 's3' }, { id: 's4' }],
    [],
  );

  const data = isInitialLoading ? skeletonRows : services;

  return (
    <>
      <FlashList
        data={data}
        keyExtractor={(item: any, index) => stableKey(item.id, `search-item-${index}`)}
        contentContainerStyle={styles.listContent}
        contentInsetAdjustmentBehavior="automatic"
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshing={searchQuery.isRefetching}
        onRefresh={() => searchQuery.refetch()}
        onEndReached={() => {
          if (searchQuery.hasNextPage && !searchQuery.isFetchingNextPage) {
            searchQuery.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.4}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <CustomerHeader title="Tìm dịch vụ" subtitle="Lọc theo nhu cầu, giá và đánh giá" />
            <TextInput
              label="Bạn cần dịch vụ gì?"
              mode="outlined"
              value={query}
              onChangeText={setQuery}
              left={<TextInput.Icon icon="magnify" />}
              right={
                query ? (
                  <TextInput.Icon
                    icon="close-circle-outline"
                    onPress={() => {
                      setQuery('');
                      Haptics.selectionAsync().catch(() => {});
                    }}
                  />
                ) : undefined
              }
              returnKeyType="search"
              autoCorrect={false}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickFiltersContainer}
            >
              <Chip
                icon="star-outline"
                selected={minRating === '4.5'}
                mode={minRating === '4.5' ? 'flat' : 'outlined'}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setMinRating(minRating === '4.5' ? '' : '4.5');
                }}
                style={[styles.quickFilterChip, minRating === '4.5' && styles.quickFilterChipActive]}
              >
                Đánh giá cao (4.5+)
              </Chip>

              <Chip
                icon="cash-outline"
                selected={maxPrice === '500000'}
                mode={maxPrice === '500000' ? 'flat' : 'outlined'}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setMaxPrice(maxPrice === '500000' ? '' : '500000');
                }}
                style={[styles.quickFilterChip, maxPrice === '500000' && styles.quickFilterChipActive]}
              >
                Giá tốt (dưới 500k)
              </Chip>

              <Chip
                icon="sort-variant"
                selected={sort === 'popular'}
                mode={sort === 'popular' ? 'flat' : 'outlined'}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setSort(sort === 'popular' ? DEFAULT_SORT : 'popular');
                }}
                style={[styles.quickFilterChip, sort === 'popular' && styles.quickFilterChipActive]}
              >
                Phổ biến nhất
              </Chip>

              <Chip
                icon="sparkles-outline"
                selected={aiMode}
                mode={aiMode ? 'flat' : 'outlined'}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setAiMode(!aiMode);
                }}
                style={[styles.quickFilterChip, aiMode && styles.quickFilterChipActive]}
              >
                AI search
              </Chip>
            </ScrollView>

            <View style={styles.actionRow}>
              <Button
                mode={aiMode ? 'contained-tonal' : 'outlined'}
                icon="sparkles"
                onPress={toggleAiMode}
                style={styles.actionButton}
              >
                AI search
              </Button>
              <Button
                mode={activeFilterCount > 0 ? 'contained-tonal' : 'outlined'}
                icon="tune-variant"
                onPress={() => {
                  setFilterOpen(true);
                  Haptics.selectionAsync().catch(() => {});
                }}
                style={styles.actionButton}
              >
                {activeFilterCount > 0 ? `Bộ lọc (${activeFilterCount})` : 'Bộ lọc'}
              </Button>
            </View>

            <FilterSummary
              aiMode={aiMode}
              categoryName={selectedCategoryName}
              minRating={minRating}
              maxPrice={maxPrice}
              onClearCategory={clearCategory}
              onClearRating={() => setMinRating('')}
              onClearPrice={() => setMaxPrice('')}
              onClearAi={() => setAiMode(false)}
            />

            {filtersActive ? (
              <Button mode="text" onPress={clearFilters} textColor={Colors.light.error}>
                Xóa bộ lọc
              </Button>
            ) : null}

            {isAiWaitingForKeyword ? (
              <InlineMessage tone="info" message="Nhập nhu cầu để AI gợi ý dịch vụ phù hợp." />
            ) : null}
            {aiMode && debouncedQuery.trim() ? (
              <InlineMessage tone="info" message="Đang xem kết quả AI search theo mô tả nhu cầu của bạn." />
            ) : null}
            {searchQuery.isError ? (
              <View style={styles.errorBlock}>
                <InlineMessage tone="error" message="Không thể tìm dịch vụ. Vui lòng thử lại." />
                <Button mode="outlined" icon="refresh" onPress={() => searchQuery.refetch()} style={styles.retryButton}>
                  Thử lại
                </Button>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !isInitialLoading && !isAiWaitingForKeyword ? (
            <View style={styles.emptyContainer}>
              <EmptyState
                icon="magnify"
                title="Không tìm thấy dịch vụ"
                description="Thử đổi từ khóa hoặc xóa bộ lọc để mở rộng kết quả."
                actionLabel={filtersActive ? 'Xóa bộ lọc' : 'Tìm lại'}
                onAction={filtersActive ? clearFilters : () => searchQuery.refetch()}
              />
              <View style={styles.trendsSection}>
                <Text variant="titleMedium" style={styles.trendsTitle}>
                  Xu hướng tìm kiếm phổ biến
                </Text>
                <View style={styles.trendsWrap}>
                  {['Sửa điện nước', 'Vệ sinh máy lạnh', 'Dọn dẹp nhà cửa', 'Sửa máy bơm'].map((trend) => (
                    <Pressable
                      key={trend}
                      onPress={() => {
                        Haptics.selectionAsync().catch(() => {});
                        setQuery(trend);
                      }}
                      style={({ pressed }) => [styles.trendChip, pressed && styles.pressed]}
                    >
                      <MaterialCommunityIcons name="trending-up" size={14} color={Colors.light.primary} />
                      <Text style={styles.trendText}>{trend}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : null
        }
        ListFooterComponent={searchQuery.isFetchingNextPage ? <ServiceSkeleton /> : null}
        renderItem={({ item }: any) => {
          const serviceId = toRouteId(item.id);
          return isInitialLoading ? (
            <ServiceSkeleton />
          ) : (
            <ServiceCard
              service={item}
              onPress={() => {
                if (!serviceId) return;
                router.push(routes.service(serviceId));
              }}
            />
          );
        }}
      />

      <ConfirmSheet
        visible={filterOpen}
        title="Bộ lọc tìm kiếm"
        description="Thu hẹp kết quả theo đánh giá, ngân sách và danh mục."
        confirmLabel="Áp dụng"
        onDismiss={() => setFilterOpen(false)}
        onConfirm={applyFilters}
      >
        <FilterGroup title="Sắp xếp theo">
          <View style={styles.chipWrap}>
            {SORT_PRESETS.map((preset) => (
              <Chip
                key={preset.value}
                selected={sort === preset.value}
                mode={sort === preset.value ? 'flat' : 'outlined'}
                onPress={() => {
                  setSort(preset.value);
                  Haptics.selectionAsync().catch(() => {});
                }}
                accessibilityLabel={`Sắp xếp ${preset.label}`}
                style={styles.filterChip}
              >
                {preset.label}
              </Chip>
            ))}
          </View>
        </FilterGroup>

        <FilterGroup title="Đánh giá tối thiểu">
          <View style={styles.chipWrap}>
            {RATING_PRESETS.map((rating) => (
              <Chip
                key={rating}
                selected={minRating === rating}
                mode={minRating === rating ? 'flat' : 'outlined'}
                onPress={() => {
                  setMinRating(minRating === rating ? '' : rating);
                  Haptics.selectionAsync().catch(() => {});
                }}
                accessibilityLabel={`Lọc đánh giá từ ${rating} sao`}
                style={styles.filterChip}
              >
                {rating}+
              </Chip>
            ))}
          </View>
        </FilterGroup>

        <FilterGroup title="Giá tối đa">
          <View style={styles.chipWrap}>
            {PRICE_PRESETS.map((price) => (
              <Chip
                key={price.value}
                selected={maxPrice === price.value}
                mode={maxPrice === price.value ? 'flat' : 'outlined'}
                onPress={() => {
                  setMaxPrice(maxPrice === price.value ? '' : price.value);
                  Haptics.selectionAsync().catch(() => {});
                }}
                accessibilityLabel={`Lọc giá tối đa ${price.label}`}
                style={styles.filterChip}
              >
                {price.label}
              </Chip>
            ))}
          </View>
          <TextInput
            label="Nhập giá tối đa"
            mode="outlined"
            value={maxPrice}
            onChangeText={(value) => setMaxPrice(sanitizePrice(value))}
            keyboardType="number-pad"
            left={<TextInput.Icon icon="cash" />}
          />
          {maxPrice ? (
            <Text variant="bodySmall" style={styles.helperText}>
              Tối đa {formatPrice(maxPrice)}
            </Text>
          ) : null}
        </FilterGroup>

        <FilterGroup title="Danh mục">
          {categoriesQueryLoading ? (
            <Text variant="bodySmall" style={styles.helperText}>
              Đang tải danh mục...
            </Text>
          ) : categories.length > 0 ? (
            <View style={styles.chipWrap}>
              {categories.slice(0, 16).map((category) => (
                <Chip
                  key={stableKey(category.id, String(category.name || 'category'))}
                  selected={String(selectedCategoryId) === String(category.id)}
                  mode={String(selectedCategoryId) === String(category.id) ? 'flat' : 'outlined'}
                  onPress={() => setCategory(String(category.id || ''))}
                  accessibilityLabel={`Lọc danh mục ${category.name || 'dịch vụ'}`}
                  style={styles.filterChip}
                >
                  {category.name || 'Danh mục'}
                </Chip>
              ))}
            </View>
          ) : (
            <InlineMessage tone="neutral" message="Chưa tải được danh mục. Bạn vẫn có thể tìm bằng từ khóa." />
          )}
        </FilterGroup>

        <View style={styles.sheetActions}>
          <Button mode="text" onPress={clearFilters} textColor={Colors.light.error}>
            Đặt lại
          </Button>
        </View>
      </ConfirmSheet>
    </>
  );
}

function FilterSummary({
  aiMode,
  categoryName,
  minRating,
  maxPrice,
  onClearCategory,
  onClearRating,
  onClearPrice,
  onClearAi,
}: {
  aiMode: boolean;
  categoryName: string;
  minRating: string;
  maxPrice: string;
  onClearCategory: () => void;
  onClearRating: () => void;
  onClearPrice: () => void;
  onClearAi: () => void;
}) {
  if (!aiMode && !categoryName && !minRating && !maxPrice) return null;
  return (
    <View style={styles.summaryWrap}>
      {aiMode ? (
        <Chip icon="sparkles" onClose={onClearAi} style={styles.summaryChip}>
          AI search
        </Chip>
      ) : null}
      {categoryName ? (
        <Chip icon="shape-outline" onClose={onClearCategory} style={styles.summaryChip}>
          {categoryName}
        </Chip>
      ) : null}
      {minRating ? (
        <Chip icon="star-outline" onClose={onClearRating} style={styles.summaryChip}>
          {minRating}+
        </Chip>
      ) : null}
      {maxPrice ? (
        <Chip icon="cash" onClose={onClearPrice} style={styles.summaryChip}>
          {formatPrice(maxPrice)}
        </Chip>
      ) : null}
    </View>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.filterGroup}>
      <Text variant="titleSmall" style={styles.filterTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16, paddingBottom: 112 },
  headerContent: { gap: 12, marginBottom: 12 },
  separator: { height: 12 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, borderRadius: 12 },
  summaryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryChip: { backgroundColor: Colors.light.primarySoft },
  errorBlock: { gap: 8 },
  retryButton: { alignSelf: 'flex-start', borderRadius: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: { borderRadius: 999 },
  filterGroup: { gap: 10 },
  filterTitle: { color: Colors.light.text, fontWeight: '900' },
  helperText: { color: Colors.light.textSecondary, lineHeight: 18 },
  sheetActions: { alignItems: 'flex-start' },
  quickFiltersContainer: { gap: 8, paddingBottom: 4, marginTop: 4 },
  quickFilterChip: { height: 32, borderRadius: 16 },
  quickFilterChipActive: { backgroundColor: Colors.light.primarySoft, borderColor: Colors.light.primary },
  emptyContainer: { gap: 24, paddingVertical: 12 },
  trendsSection: { gap: 12, paddingHorizontal: 16, marginTop: 12 },
  trendsTitle: { color: Colors.light.text, fontWeight: '800' },
  trendsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  trendChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.light.surfaceVariant, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  trendText: { fontSize: 13, color: Colors.light.text, fontWeight: '700' },
  pressed: { opacity: 0.72 },
});
