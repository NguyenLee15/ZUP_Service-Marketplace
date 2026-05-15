/**
 * Services List - Provider's services.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, FAB, IconButton, Switch, Text, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { serviceApi } from '../features/service/service.api';
import { Colors } from '../constants/colors';
import {
  ProviderCard,
  ProviderEmptyState,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderScreen,
  ProviderSectionHeader,
  ProviderStatusChip,
} from '../components/provider/provider-ui';

type FilterKey = 'ALL' | 'ACTIVE' | 'HIDDEN' | 'PENDING' | 'REJECTED';

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'ACTIVE', label: 'Đang hiện' },
  { key: 'HIDDEN', label: 'Tạm ẩn' },
  { key: 'PENDING', label: 'Chờ duyệt' },
  { key: 'REJECTED', label: 'Từ chối' },
];

export default function ServicesScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [services, setServices] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [message, setMessage] = useState<{ tone: 'success' | 'warning' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      const res = await serviceApi.getMyServices();
      setServices(res.data?.data || []);
    } catch {
      setMessage({ tone: 'error', text: 'Không thể tải danh sách dịch vụ. Kéo xuống để thử lại.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setMessage(null);
    await fetchServices();
    setRefreshing(false);
  }, [fetchServices]);

  const filteredServices = useMemo(() => {
    if (filter === 'ALL') return services;
    return services.filter(service => service.status === filter);
  }, [filter, services]);

  const toggleServiceStatus = async (service: any) => {
    if (service.status !== 'ACTIVE' && service.status !== 'HIDDEN') {
      setMessage({ tone: 'warning', text: 'Chỉ có thể ẩn hoặc hiện dịch vụ đang hoạt động.' });
      return;
    }

    const isActive = service.status === 'ACTIVE';
    setMessage(null);
    setServices(prev =>
      prev.map(item => (item.id === service.id ? { ...item, status: isActive ? 'HIDDEN' : 'ACTIVE' } : item)),
    );

    try {
      if (isActive) await serviceApi.hideService(service.id);
      else await serviceApi.showService(service.id);
      setMessage({ tone: 'success', text: isActive ? 'Dịch vụ đã được tạm ẩn.' : 'Dịch vụ đã được hiển thị lại.' });
    } catch (err: any) {
      setServices(prev =>
        prev.map(item => (item.id === service.id ? { ...item, status: isActive ? 'ACTIVE' : 'HIDDEN' } : item)),
      );
      setMessage({
        tone: 'error',
        text: err?.response?.data?.error?.message || 'Không thể thay đổi trạng thái dịch vụ.',
      });
    }
  };

  const formatCurrency = (value?: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return Colors.light.success;
      case 'HIDDEN':
        return Colors.light.textSecondary;
      case 'PENDING':
        return Colors.light.warning;
      case 'DRAFT':
        return Colors.light.primary;
      case 'REJECTED':
        return Colors.light.error;
      default:
        return Colors.light.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Đang hiện';
      case 'HIDDEN':
        return 'Tạm ẩn';
      case 'PENDING':
        return 'Chờ duyệt';
      case 'DRAFT':
        return 'Bản nháp';
      case 'REJECTED':
        return 'Từ chối';
      default:
        return status || 'Không rõ';
    }
  };

  const renderService = ({ item }: { item: any }) => {
    const color = getStatusColor(item.status);
    const canToggle = item.status === 'ACTIVE' || item.status === 'HIDDEN';

    return (
      <ProviderCard
        style={styles.serviceCard}
        accessibilityLabel={`Dịch vụ ${item.name}`}
        onPress={() =>
          router.push({ pathname: '/service/create', params: { id: item.id, serviceData: JSON.stringify(item) } } as any)
        }
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBlock}>
            <Text variant="titleMedium" style={styles.serviceTitle} numberOfLines={2} selectable>
              {item.name}
            </Text>
            <Text variant="bodySmall" style={styles.serviceCategory} numberOfLines={1}>
              {item.category?.name || 'Chưa có danh mục'}
            </Text>
          </View>
          <ProviderStatusChip label={getStatusLabel(item.status)} color={color} />
        </View>

        <View style={styles.metaRow}>
          <View>
            <Text variant="labelSmall" style={styles.metaLabel}>
              Giá tham khảo
            </Text>
            <Text variant="titleMedium" style={styles.priceText} selectable>
              {formatCurrency(item.basePrice || item.referencePrice)}
            </Text>
          </View>
          {canToggle && (
            <View style={styles.switchRow}>
              <Text variant="labelSmall" style={styles.switchLabel}>
                {item.status === 'ACTIVE' ? 'Đang hiện' : 'Tạm ẩn'}
              </Text>
              <Switch
                value={item.status === 'ACTIVE'}
                onValueChange={() => toggleServiceStatus(item)}
                color={theme.colors.primary}
                accessibilityLabel={`${item.status === 'ACTIVE' ? 'Ẩn' : 'Hiện'} dịch vụ ${item.name}`}
              />
            </View>
          )}
        </View>

        <View style={styles.actionRow}>
          <Button
            mode="text"
            compact
            icon="star-outline"
            onPress={() => router.push(`/service/${item.id}/reviews` as any)}
          >
            Đánh giá
          </Button>
          <Button
            mode="outlined"
            compact
            icon="pencil-outline"
            onPress={() =>
              router.push({ pathname: '/service/create', params: { id: item.id, serviceData: JSON.stringify(item) } } as any)
            }
            style={styles.editButton}
          >
            Sửa
          </Button>
        </View>
      </ProviderCard>
    );
  };

  return (
    <ProviderScreen>
      <FlatList
        data={filteredServices}
        keyExtractor={item => String(item.id)}
        renderItem={renderService}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.light.primary]} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerStack}>
            <ProviderPageHeader
              title="Quản lý dịch vụ"
              subtitle="Bật tắt hiển thị, chỉnh sửa giá và theo dõi trạng thái duyệt."
              action={
                <IconButton
                  icon="arrow-left"
                  mode="contained-tonal"
                  onPress={() => router.back()}
                  accessibilityLabel="Quay lại"
                />
              }
            />

            {message && <ProviderInlineMessage tone={message.tone} message={message.text} />}

            <View style={styles.filterRow}>
              {filters.map(item => (
                <ProviderStatusChip
                  key={item.key}
                  label={item.label}
                  color={item.key === 'ALL' ? Colors.light.primary : getStatusColor(item.key)}
                  selected={filter === item.key}
                  onPress={() => setFilter(item.key)}
                />
              ))}
            </View>

            <ProviderSectionHeader
              title={`${filteredServices.length} dịch vụ`}
              actionLabel="Tạo mới"
              onAction={() => router.push('/service/create')}
            />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loading} color={theme.colors.primary} />
          ) : (
            <ProviderEmptyState
              icon="briefcase-plus-outline"
              title={filter === 'ALL' ? 'Bạn chưa có dịch vụ' : 'Không có dịch vụ phù hợp'}
              description={
                filter === 'ALL'
                  ? 'Tạo dịch vụ đầu tiên để khách hàng có thể đặt lịch với bạn.'
                  : 'Đổi bộ lọc để xem các dịch vụ ở trạng thái khác.'
              }
              actionLabel={filter === 'ALL' ? 'Tạo dịch vụ' : 'Xem tất cả'}
              onAction={() => (filter === 'ALL' ? router.push('/service/create') : setFilter('ALL'))}
            />
          )
        }
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color="#fff"
        onPress={() => router.push('/service/create')}
        accessibilityLabel="Tạo dịch vụ mới"
      />
    </ProviderScreen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 112,
  },
  headerStack: {
    gap: 14,
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardTitleBlock: {
    flex: 1,
  },
  serviceTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  serviceCategory: {
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  metaLabel: {
    color: Colors.light.textSecondary,
  },
  priceText: {
    color: Colors.light.primary,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    color: Colors.light.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  editButton: {
    borderRadius: 999,
  },
  loading: {
    marginTop: 40,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    borderRadius: 28,
  },
});
