import { useActiveColors } from '../../../hooks/useActiveColors';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { io } from 'socket.io-client';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Text } from 'react-native-paper';
import {
  CustomerCard,
  EmptyState,
  InlineMessage,
  StatusChip,
  Timeline,
} from '../../../components/customer/customer-ui';
import { BOOKING_STATUS_COLOR, BOOKING_STATUS_LABEL } from '../../../constants/booking-status';
import { Colors } from '../../../constants/colors';
import { WS_URL } from '../../../constants/api';
import { bookingApi } from '../../../features/booking/booking.api';
import { getApiErrorMessage, unwrapData } from '../../../lib/api-response';
import { formatDateTime } from '../../../lib/format';
import { storage } from '../../../lib/storage';
import { getTrackingSocket } from '../../../lib/socket';
import { useNetworkStatus } from '../../../hooks/useNetworkStatus';
import { routes } from '../../../lib/route-utils';

type TrackingConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

type TrackingLocation = {
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  updatedAt?: string | null;
  source: 'lastKnown' | 'live';
};

type TrackingBooking = {
  id?: number | string;
  bookingCode?: string | null;
  status?: string | null;
  desiredTime?: string | Date | null;
  providerArrivedAt?: string | Date | null;
  providerAcceptedAt?: string | Date | null;
  addressDetail?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  service?: {
    id?: number | string;
    name?: string | null;
  } | null;
  provider?: {
    id?: number | string;
    fullName?: string | null;
    phone?: string | null;
  } | null;
};


const BASE_TRACK_STEPS = [
  { key: 'CONFIRMED', label: 'Đã xác nhận lịch', description: 'Lịch hẹn đã được chốt.' },
  { key: 'IN_PROGRESS', label: 'Đang thực hiện', description: 'Nhà cung cấp đang xử lý đơn.' },
  { key: 'DONE', label: 'Hoàn thành', description: 'Dịch vụ đã hoàn tất.' },
];

const TERMINAL_TRACK_STEPS: Record<string, { label: string; description: string }> = {
  CANCELLED: { label: 'Đã hủy', description: 'Đơn hàng đã được hủy.' },
  DISPUTED: { label: 'Đang tranh chấp', description: 'Đơn hàng đang được xử lý tranh chấp.' },
  REJECTED: { label: 'Đã từ chối', description: 'Yêu cầu đã bị từ chối.' },
};

function isValidBookingId(value: number) {
  return Number.isFinite(value) && value > 0;
}

const TRACKABLE_STATUSES = ['QUOTED', 'CONFIRMED', 'IN_PROGRESS'];

function isTrackableStatus(booking?: TrackingBooking | null) {
  if (!booking) return false;
  if (booking.status === 'PENDING' && booking.providerAcceptedAt) return true;
  return TRACKABLE_STATUSES.includes(String(booking.status || ''));
}

function toFiniteNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeTrackingLocation(payload: any, source: TrackingLocation['source']): TrackingLocation | null {
  const data = source === 'lastKnown' ? payload?.location : payload;
  const lat = toFiniteNumber(data?.lat);
  const lng = toFiniteNumber(data?.lng);

  if (lat === null || lng === null) return null;

  return {
    lat,
    lng,
    heading: toFiniteNumber(data?.heading),
    speed: toFiniteNumber(data?.speed),
    updatedAt: data?.updatedAt || null,
    source,
  };
}

function getConnectionMessage(
  state: TrackingConnectionState,
  trackingEnded: string | null,
  trackable: boolean,
  hasLocation: boolean,
  socketError?: string | null,
) {
  if (trackingEnded) {
    return {
      tone: 'warning' as const,
      message: `Tracking đã kết thúc: ${BOOKING_STATUS_LABEL[trackingEnded] || trackingEnded}`,
    };
  }
  if (!trackable) {
    return {
      tone: 'info' as const,
      message: 'Đơn hàng chưa ở trạng thái hỗ trợ theo dõi realtime.',
    };
  }
  if (state === 'connecting') {
    return { tone: 'info' as const, message: 'Đang kết nối vị trí realtime...' };
  }
  if (state === 'connected') {
    return {
      tone: hasLocation ? ('success' as const) : ('info' as const),
      message: hasLocation
        ? 'Đang nhận cập nhật vị trí realtime.'
        : 'Đã kết nối, đang chờ nhà cung cấp gửi vị trí.',
    };
  }
  if (state === 'error') {
    return {
      tone: 'warning' as const,
      message: socketError || 'Chưa thể kết nối realtime. Bạn vẫn có thể xem trạng thái đơn.',
    };
  }
  if (state === 'disconnected') {
    return {
      tone: 'warning' as const,
      message: 'Kết nối realtime đã ngắt. Bấm Làm mới để thử lại.',
    };
  }
  return null;
}

function getTrackingSteps(status?: string | null, providerArrivedAt?: string | Date | null) {
  const steps = [...BASE_TRACK_STEPS];
  if (providerArrivedAt) {
    steps.splice(1, 0, { key: 'ARRIVED', label: 'Thợ đã đến', description: 'Thợ đã đến địa điểm của bạn.' });
  }

  if (status && TERMINAL_TRACK_STEPS[status]) {
    return [
      steps[0],
      ...(providerArrivedAt ? [steps[1]] : []),
      { key: status, ...TERMINAL_TRACK_STEPS[status] },
    ];
  }
  return steps;
}

function formatLocationMeta(location: TrackingLocation | null) {
  if (!location) return 'Chưa có dữ liệu vị trí.';

  const details = [
    location.updatedAt ? `Cập nhật ${formatDateTime(location.updatedAt)}` : null,
    location.source === 'live' ? 'Realtime' : 'Vị trí gần nhất',
    location.speed !== null && location.speed !== undefined ? `Tốc độ ${Math.max(0, location.speed).toFixed(1)} m/s` : null,
    location.heading !== null && location.heading !== undefined ? `Hướng ${Math.round(location.heading)}°` : null,
  ].filter(Boolean);

  return details.join(' · ');
}

function fullAddress(booking?: TrackingBooking | null) {
  return [booking?.addressDetail, booking?.ward, booking?.district, booking?.province]
    .filter(Boolean)
    .filter((p) => p !== 'Không áp dụng')
    .join(', ');
}

export default function TrackingScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const bookingId = Number(id);
  const validBookingId = isValidBookingId(bookingId);
  const [location, setLocation] = useState<TrackingLocation | null>(null);
  const [trackingEnded, setTrackingEnded] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<TrackingConnectionState>('idle');
  const [socketError, setSocketError] = useState<string | null>(null);
  const [socketRefreshKey, setSocketRefreshKey] = useState(0);

  const bookingQuery = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: async () => unwrapData<TrackingBooking>(await bookingApi.getById(bookingId)),
    enabled: validBookingId,
  });

  const booking = bookingQuery.data;
  const trackable = isTrackableStatus(booking);

  useEffect(() => {
    setTrackingEnded(null);
    setLocation(null);
  }, [bookingId]);

  useEffect(() => {
    if (!validBookingId || !trackable) {
      setConnectionState('idle');
      return;
    }

    let active = true;
    let socket: ReturnType<typeof io> | null = null;

    setConnectionState('connecting');
    setSocketError(null);

    storage
      .getAccessToken()
      .then((token) => {
        if (!active) return;
        if (!token) {
          setConnectionState('error');
          setSocketError('Phiên đăng nhập chưa sẵn sàng để nhận vị trí realtime.');
          return;
        }

        socket = io(`${WS_URL}/tracking`, {
          transports: ['websocket'],
          auth: (cb) => {
            storage.getAccessToken().then(t => cb({ token: t }));
          },
        });

        socket.on('connect', () => {
          if (!active) return;
          setConnectionState('connected');
          setSocketError(null);
          socket?.emit('subscribeTracking', { bookingId });
        });

        socket.on('disconnect', () => {
          if (!active) return;
          setConnectionState('disconnected');
        });

        socket.on('connect_error', (error: Error) => {
          if (!active) return;
          setConnectionState('error');
          setSocketError(error?.message || 'Không thể kết nối tracking realtime.');
        });

        socket.on('lastKnownLocation', (payload: any) => {
          if (!active || Number(payload?.bookingId) !== bookingId) return;
          const nextLocation = normalizeTrackingLocation(payload, 'lastKnown');
          if (nextLocation) setLocation(nextLocation);
        });

        socket.on('providerLocation', (payload: any) => {
          if (!active || Number(payload?.bookingId) !== bookingId) return;
          const nextLocation = normalizeTrackingLocation(payload, 'live');
          if (nextLocation) setLocation(nextLocation);
        });

        socket.on('trackingEnded', (payload: any) => {
          if (!active || Number(payload?.bookingId) !== bookingId) return;
          setTrackingEnded(payload?.reason || 'Đã kết thúc theo dõi');
          setConnectionState('disconnected');
        });
      })
      .catch((error) => {
        if (!active) return;
        setConnectionState('error');
        setSocketError(error?.message || 'Không thể đọc phiên đăng nhập.');
      });

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && socket) {
        if (!socket.connected) {
          socket.connect();
        }
      }
    });

    return () => {
      active = false;
      subscription.remove();
      socket?.emit('unsubscribeTracking', { bookingId });
      socket?.disconnect();
    };
  }, [bookingId, socketRefreshKey, trackable, validBookingId]);

  const region = useMemo(() => {
    if (!location) return null;
    return {
      latitude: location.lat,
      longitude: location.lng,
      latitudeDelta: 0.018,
      longitudeDelta: 0.018,
    };
  }, [location]);

  const connectionMessage = getConnectionMessage(
    connectionState,
    trackingEnded,
    trackable,
    Boolean(location),
    socketError,
  );

  const refreshTracking = () => {
    Haptics.selectionAsync().catch(() => {});
    bookingQuery.refetch();
    setSocketRefreshKey((value) => value + 1);
  };

  if (!validBookingId) {
    return (
      <View style={styles.screen}>
        <EmptyState
          icon="map-marker-alert-outline"
          title="Đơn hàng không hợp lệ"
          description="Vui lòng quay lại danh sách đơn hàng."
          actionLabel="Về đơn hàng"
          onAction={() => router.replace(routes.tabs.bookings)}
        />
      </View>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <TrackingSkeleton />
      </ScrollView>
    );
  }

  if (bookingQuery.isError || !booking) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <InlineMessage
          tone="error"
          message={getApiErrorMessage(bookingQuery.error, 'Không thể tải thông tin theo dõi đơn hàng.')}
        />
        <EmptyState
          icon="map-marker-off-outline"
          title="Không tìm thấy đơn hàng"
          description="Đơn hàng có thể không tồn tại hoặc bạn không có quyền xem."
          actionLabel="Về đơn hàng"
          onAction={() => router.replace(routes.tabs.bookings)}
        />
        <Button mode="outlined" icon="refresh" onPress={() => bookingQuery.refetch()} style={styles.roundedButton}>
          Thử lại
        </Button>
      </ScrollView>
    );
  }

  const statusColor = BOOKING_STATUS_COLOR[status] || activeColors.textSecondary;
  const timelineSteps = getTrackingSteps(status, booking?.providerArrivedAt);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={
        <RefreshControl refreshing={bookingQuery.isRefetching} onRefresh={refreshTracking} />
      }
    >
      <View style={styles.headerBlock}>
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Theo dõi đơn
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle} numberOfLines={1}>
          {booking.service?.name || booking.bookingCode || `Đơn #${booking.id || bookingId}`}
        </Text>
      </View>

      {isOnline === false ? (
        <InlineMessage tone="warning" message="Đang ngoại tuyến. Dữ liệu realtime sẽ cập nhật lại khi có mạng." />
      ) : null}

      {connectionMessage ? (
        <InlineMessage tone={connectionMessage.tone} message={connectionMessage.message} />
      ) : null}

      <SummaryCard booking={booking} statusColor={statusColor} />

      {region ? (
        <View style={styles.mapShell}>
          <MapView style={styles.map} initialRegion={region} region={region}>
            <Marker
              coordinate={{ latitude: location!.lat, longitude: location!.lng }}
              title={booking.provider?.fullName || 'Vị trí nhà cung cấp'}
              description={formatLocationMeta(location)}
            />
          </MapView>
          {/* ConnectionBadge floating trên map */}
          <View style={styles.connectionBadge}>
            <View style={[styles.connectionDot, {
              backgroundColor: connectionState === 'connected' ? activeColors.success
                : connectionState === 'connecting' ? activeColors.warning
                : activeColors.error
            }]} />
            <Text variant="labelSmall" style={styles.connectionBadgeText}>
              {connectionState === 'connected' ? 'Realtime'
                : connectionState === 'connecting' ? 'Kết nối...'
                : 'Offline'}
            </Text>
          </View>
        </View>
      ) : (
        <NoLocationCard trackable={trackable} status={status} />
      )}

      {/* Provider info khi có location */}
      {location && booking.provider ? (
        <ProviderInfoCard
          name={booking.provider.fullName || 'Nhà cung cấp'}
          phone={booking.provider.phone || null}
          locationMeta={formatLocationMeta(location)}
        />
      ) : null}

      <CustomerCard>
        <View style={styles.locationMetaHeader}>
          <MaterialCommunityIcons
            name={location?.source === 'live' ? 'crosshairs-gps' : 'map-marker-outline'}
            size={22}
            color={location ? activeColors.primary : activeColors.textSecondary}
          />
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={styles.titleText}>
              Dữ liệu vị trí
            </Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              {formatLocationMeta(location)}
            </Text>
          </View>
        </View>
      </CustomerCard>

      <Timeline status={status} steps={timelineSteps} />

      <View style={styles.actionRow}>
        <Button mode="outlined" icon="refresh" onPress={refreshTracking} style={styles.flexButton}>
          Làm mới
        </Button>
        <Button
          mode="contained"
          icon="clipboard-text-outline"
          onPress={() => router.push(routes.booking.detail(String(bookingId)))}
          style={styles.flexButton}
        >
          Chi tiết đơn
        </Button>
      </View>
    </ScrollView>
  );
}

function ProviderInfoCard({
  name,
  phone,
  locationMeta,
}: {
  name: string;
  phone: string | null;
  locationMeta: string;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const handleCall = () => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  return (
    <CustomerCard>
      <View style={styles.providerRow}>
        <View style={styles.providerAvatar}>
          <MaterialCommunityIcons name="account-hard-hat" size={24} color={activeColors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" style={styles.titleText}>
            {name}
          </Text>
          <Text variant="bodySmall" style={styles.subtitle} numberOfLines={1}>
            {locationMeta}
          </Text>
        </View>
        {phone ? (
          <Pressable
            style={styles.callButton}
            onPress={handleCall}
            accessibilityRole="button"
            accessibilityLabel={`Gọi điện cho ${name}`}
          >
            <MaterialCommunityIcons name="phone" size={20} color="#FFF" />
          </Pressable>
        ) : null}
      </View>
    </CustomerCard>
  );
}

function SummaryCard({ booking, statusColor }: { booking: TrackingBooking; statusColor: string }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const status = booking.status || 'Không rõ';
  const address = fullAddress(booking);

  return (
    <CustomerCard>
      <View style={styles.cardBlock}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text variant="labelSmall" style={styles.codeText} selectable>
              #{booking.bookingCode || booking.id}
            </Text>
            <Text variant="titleMedium" style={styles.titleText} numberOfLines={2}>
              {booking.service?.name || 'Dịch vụ'}
            </Text>
          </View>
          <StatusChip label={BOOKING_STATUS_LABEL[status] || status} color={statusColor} />
        </View>
        <InfoRow icon="account-hard-hat-outline" text={booking.provider?.fullName || 'Chưa có nhà cung cấp'} />
        <InfoRow icon="calendar-clock" text={formatDateTime(booking.desiredTime)} />
        {address ? <InfoRow icon="map-marker-outline" text={address} /> : null}
      </View>
    </CustomerCard>
  );
}

function NoLocationCard({ trackable, status }: { trackable: boolean; status: string }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <CustomerCard>
      <View style={styles.noLocation}>
        <View style={styles.emptyMapIcon}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <MaterialCommunityIcons name="map-marker-radius-outline" size={28} color={activeColors.primary} />
          </Animated.View>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="titleMedium" style={styles.titleText}>
            {trackable ? 'Đang chờ vị trí...' : 'Chưa hỗ trợ theo dõi'}
          </Text>
          <Text variant="bodySmall" style={styles.subtitle}>
            {trackable
              ? 'Bản đồ sẽ xuất hiện khi nhà cung cấp bắt đầu chia sẻ vị trí cho đơn này.'
              : `Trạng thái ${BOOKING_STATUS_LABEL[status] || status || 'hiện tại'} chưa hỗ trợ theo dõi vị trí.`}
          </Text>
        </View>
      </View>
    </CustomerCard>
  );
}

function InfoRow({ icon, text }: { icon: React.ComponentProps<typeof MaterialCommunityIcons>['name']; text: string }) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={17} color={activeColors.textSecondary} />
      <Text variant="bodySmall" style={styles.infoText} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

function TrackingSkeleton() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <View style={styles.cardBlock}>
      <View style={[styles.skeleton, { width: '54%', height: 28 }]} />
      <View style={[styles.skeleton, { width: '72%', height: 16 }]} />
      <CustomerCard>
        <View style={styles.cardBlock}>
          <View style={[styles.skeleton, { width: '44%', height: 18 }]} />
          <View style={[styles.skeleton, { width: '88%', height: 16 }]} />
          <View style={[styles.skeleton, { width: '74%', height: 16 }]} />
        </View>
      </CustomerCard>
      <View style={[styles.skeleton, { height: 300, borderRadius: 18 }]} />
      <CustomerCard>
        <View style={styles.cardBlock}>
          <View style={[styles.skeleton, { width: '42%', height: 18 }]} />
          <View style={[styles.skeleton, { width: '80%', height: 14 }]} />
        </View>
      </CustomerCard>
    </View>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: activeColors.background },
  content: { padding: 16, paddingBottom: 120, gap: 16 },
  headerBlock: { gap: 5, paddingTop: 12 },
  headerTitle: { color: activeColors.text, fontWeight: '900' },
  subtitle: { color: activeColors.textSecondary, lineHeight: 20 },
  cardBlock: { gap: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  codeText: { color: activeColors.primary, fontWeight: '900' },
  titleText: { color: activeColors.text, fontWeight: '900' },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  infoText: { flex: 1, color: activeColors.textSecondary, lineHeight: 19 },
  mapShell: {
    height: 340,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: activeColors.border,
    backgroundColor: activeColors.surfaceVariant,
    position: 'relative',
  },
  map: { flex: 1 },
  connectionBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(15,23,42,0.72)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  connectionDot: { width: 8, height: 8, borderRadius: 4 },
  connectionBadgeText: { color: '#FFFFFF', fontWeight: '700' },
  // Provider info
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: activeColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: activeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noLocation: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyMapIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: activeColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationMetaHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  flexButton: { flex: 1, borderRadius: 12 },
  roundedButton: { alignSelf: 'center', borderRadius: 12 },
  skeleton: { backgroundColor: activeColors.surfaceVariant, borderRadius: 10 },
});
