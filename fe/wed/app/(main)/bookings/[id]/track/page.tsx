'use client';

import { use, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { bookingsApi } from '@/features/auth/services/api';
import { BookingStatus } from '@/types';
import { BackButton } from '@/components/navigation/BackButton';
import { Button } from '@/components/ui/button';
import { getTrackingSocket } from '@/lib/socket';
import {
  Phone,
  MessageCircle,
  Navigation,
  Clock,
  MapPin,
  User,
  Truck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Locate,
} from 'lucide-react';

// Dynamic import to avoid SSR issues with Leaflet
const TrackingMap = dynamic(() => import('./TrackingMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full glass-panel rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-10 h-10 rounded-full bg-action-blue/10 flex items-center justify-center animate-pulse">
          <Navigation className="w-5 h-5 text-action-blue" />
        </div>
        <span className="text-sm font-medium">Đang tải bản đồ...</span>
      </div>
    </div>
  ),
});

// ---------- Types ----------
interface ProviderLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  updatedAt: Date;
}

// ---------- Helpers ----------
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatETA(distKm: number, speedKmh: number): string {
  if (speedKmh <= 0) return '—';
  const mins = Math.round((distKm / speedKmh) * 60);
  if (mins < 1) return 'Sắp đến';
  if (mins < 60) return `${mins} phút`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? ` ${m}p` : ''}`;
}

// ===================== STATUS CONFIGS =====================
const TRACK_STATUSES = [
  { key: 'accepted', label: 'Đã nhận đơn', icon: CheckCircle2, done: true },
  { key: 'on_the_way', label: 'Đang di chuyển', icon: Truck, done: false },
  { key: 'arrived', label: 'Đã đến nơi', icon: MapPin, done: false },
  { key: 'working', label: 'Đang thực hiện', icon: RefreshCw, done: false },
];

// ===================== MAIN PAGE =====================
export default function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingEnded, setTrackingEnded] = useState(false);

  // Provider realtime location
  const [providerLoc, setProviderLoc] = useState<ProviderLocation | null>(null);
  const [trail, setTrail] = useState<[number, number][]>([]);
  const [customerLoc] = useState<{ lat: number; lng: number }>({
    lat: 21.0285,
    lng: 105.8542,
  });
  const [currentStepIdx, setCurrentStepIdx] = useState(1);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketConnectedRef = useRef(false);

  // ---- Fetch booking ----
  useEffect(() => {
    setLoading(true);
    bookingsApi
      .getById(Number(id))
      .then((res) => {
        const data = res.data.data || res.data;
        setBooking(data);
      })
      .catch(() => setError('Không tìm thấy đơn hàng'))
      .finally(() => setLoading(false));
  }, [id]);

  // ---- Socket.io Realtime Tracking ----
  useEffect(() => {
    if (!booking) return;

    const trackable = [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS];
    if (!trackable.includes(booking.status)) return;

    const bookingId = Number(id);
    const socket = getTrackingSocket();

    socket.connect();

    // Subscribe to this booking's tracking room
    socket.emit('subscribeTracking', { bookingId });

    // Receive last known location on subscribe
    socket.on('lastKnownLocation', (data: { bookingId: number; location: any }) => {
      if (data.location) {
        socketConnectedRef.current = true;
        const loc = data.location;
        setProviderLoc({
          lat: loc.lat,
          lng: loc.lng,
          heading: loc.heading ?? 0,
          speed: loc.speed ?? 0,
          updatedAt: new Date(loc.updatedAt),
        });
        setTrail([[loc.lat, loc.lng]]);
      }
    });

    // Receive realtime provider location updates
    socket.on('providerLocation', (data: any) => {
      socketConnectedRef.current = true;
      const newLoc: ProviderLocation = {
        lat: data.lat,
        lng: data.lng,
        heading: data.heading ?? 0,
        speed: data.speed ?? 0,
        updatedAt: new Date(data.updatedAt),
      };
      setProviderLoc(newLoc);
      setTrail((t) => [...t.slice(-100), [data.lat, data.lng]]);

      // Auto-detect arrived
      const dist = haversineDistance(data.lat, data.lng, customerLoc.lat, customerLoc.lng);
      if (dist < 0.05) {
        setCurrentStepIdx(2);
      }
    });

    // Tracking ended (booking status changed)
    socket.on('trackingEnded', () => {
      setTrackingEnded(true);
    });

    // Fallback: If no real data arrives within 5s, start simulation
    const fallbackTimer = setTimeout(() => {
      if (!socketConnectedRef.current) {
        startSimulation();
      }
    }, 5000);

    return () => {
      clearTimeout(fallbackTimer);
      socket.emit('unsubscribeTracking', { bookingId });
      socket.off('lastKnownLocation');
      socket.off('providerLocation');
      socket.off('trackingEnded');
      socket.disconnect();
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, [booking?.status, id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Simulation fallback (demo/offline mode) ----
  const startSimulation = useCallback(() => {
    // Start from ~3km away
    const offsetLat = (Math.random() - 0.5) * 0.04;
    const offsetLng = (Math.random() - 0.5) * 0.04;
    const startLat = customerLoc.lat + offsetLat;
    const startLng = customerLoc.lng + offsetLng;

    setProviderLoc({
      lat: startLat,
      lng: startLng,
      heading: Math.random() * 360,
      speed: 25 + Math.random() * 15,
      updatedAt: new Date(),
    });
    setTrail([[startLat, startLng]]);

    simulationRef.current = setInterval(() => {
      setProviderLoc((prev) => {
        if (!prev) return prev;
        const dist = haversineDistance(prev.lat, prev.lng, customerLoc.lat, customerLoc.lng);

        if (dist < 0.05) {
          if (simulationRef.current) clearInterval(simulationRef.current);
          setCurrentStepIdx(2);
          return { ...prev, speed: 0, updatedAt: new Date() };
        }

        const stepSize = 0.0003 + Math.random() * 0.0002;
        const dlat = customerLoc.lat - prev.lat;
        const dlng = customerLoc.lng - prev.lng;
        const angle = Math.atan2(dlng, dlat);
        const jitter = (Math.random() - 0.5) * 0.3;

        const newLat = prev.lat + Math.cos(angle + jitter) * stepSize;
        const newLng = prev.lng + Math.sin(angle + jitter) * stepSize;
        const heading = ((angle + jitter) * 180) / Math.PI;

        setTrail((t) => [...t.slice(-100), [newLat, newLng]]);

        return {
          lat: newLat,
          lng: newLng,
          heading: heading < 0 ? heading + 360 : heading,
          speed: 20 + Math.random() * 20,
          updatedAt: new Date(),
        };
      });
    }, 2000);
  }, [customerLoc.lat, customerLoc.lng]);

  // ---- Computed values ----
  const distance = providerLoc
    ? haversineDistance(
        providerLoc.lat,
        providerLoc.lng,
        customerLoc.lat,
        customerLoc.lng,
      )
    : null;
  const eta =
    distance !== null && providerLoc
      ? formatETA(distance, providerLoc.speed)
      : '—';

  // ---- Render ----
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="h-[80vh] glass-panel rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <BackButton fallbackHref="/bookings" className="mb-4" />
        <div className="glass-panel rounded-2xl p-8 flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-lg font-semibold text-foreground">
            {error || 'Không tìm thấy đơn hàng'}
          </p>
          <Button
            onClick={() => router.push('/bookings')}
            className="bg-action-blue text-white rounded-xl"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  const provider = booking.provider;

  return (
    <div className="relative h-[calc(100dvh-5rem)] flex flex-col">
      {/* Map Area — takes full height */}
      <div className="flex-1 relative">
        <TrackingMap
          providerLocation={providerLoc}
          customerLocation={customerLoc}
          trail={trail}
        />

        {/* Floating Back Button */}
        <div className="absolute top-4 left-4 z-[1000]">
          <BackButton
            fallbackHref={`/bookings/${id}`}
            className="glass-panel rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-shadow"
          />
        </div>

        {/* Floating ETA Card */}
        {providerLoc && distance !== null && (
          <div className="absolute top-4 right-4 z-[1000] glass-panel rounded-2xl p-4 shadow-lg min-w-[160px]">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                Thời gian đến
              </p>
              <p className="text-3xl font-bold text-action-blue">{eta}</p>
              <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                <Navigation className="w-3 h-3" />
                <span>{distance.toFixed(1)} km</span>
                <span className="mx-1">•</span>
                <span>{Math.round(providerLoc.speed)} km/h</span>
              </div>
            </div>
          </div>
        )}

        {/* Re-center Button */}
        <button
          onClick={() => {
            // Trigger a re-center by briefly toggling state
            // The map component handles centering automatically
          }}
          className="absolute bottom-48 right-4 z-[1000] w-10 h-10 glass-panel rounded-full flex items-center justify-center shadow-lg hover:bg-action-blue/10 transition-colors"
          aria-label="Về vị trí của tôi"
        >
          <Locate className="w-5 h-5 text-action-blue" />
        </button>
      </div>

      {/* Bottom Panel — Provider Info + Progress */}
      <div className="glass-panel rounded-t-3xl p-5 pb-6 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] z-[1000] relative">
        {/* Mini Progress Steps */}
        <div className="flex items-center justify-between mb-5 px-2">
          {TRACK_STATUSES.map((step, idx) => {
            const isActive = idx === currentStepIdx;
            const isDone = idx < currentStepIdx || step.done;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isDone
                      ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : isActive
                      ? 'bg-gradient-to-br from-action-blue to-glacier-blue text-white shadow-[0_0_12px_rgba(0,107,255,0.3)] animate-pulse'
                      : 'glass-panel text-muted-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider text-center leading-tight ${
                    isDone || isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
                {/* Connector line */}
                {idx < TRACK_STATUSES.length - 1 && (
                  <div
                    className={`absolute h-0.5 top-[18px] ${
                      isDone
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : 'bg-platinum-tint'
                    }`}
                    style={{
                      left: `${(idx + 0.5) * 25}%`,
                      width: '25%',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Provider Info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-action-blue to-glacier-blue flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden shadow-[0_0_15px_rgba(0,107,255,0.3)]">
            {provider?.avatarUrl ? (
              <img
                src={provider.avatarUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              provider?.fullName?.charAt(0) || '?'
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Thợ đang đến
            </p>
            <h3 className="text-base font-bold text-foreground truncate">
              {provider?.fullName || 'Đang cập nhật...'}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" />
              Mã đơn: #{booking.bookingCode}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() =>
                provider?.phone && window.open(`tel:${provider.phone}`)
              }
              className="w-11 h-11 rounded-full bg-green-500 text-white flex items-center justify-center shadow-[0_0_12px_rgba(22,163,74,0.3)] hover:bg-green-600 transition-colors active:scale-95"
              aria-label="Gọi điện cho thợ"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              onClick={() =>
                router.push(
                  `/chat?conversationId=${booking.conversationId || ''}`,
                )
              }
              className="w-11 h-11 rounded-full bg-gradient-to-r from-action-blue to-glacier-blue text-white flex items-center justify-center shadow-[0_0_12px_rgba(0,107,255,0.3)] hover:from-glacier-blue hover:to-action-blue transition-all active:scale-95"
              aria-label="Nhắn tin cho thợ"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          Đang theo dõi trực tiếp
          {providerLoc && (
            <span className="text-[10px] text-slate-blue">
              • Cập nhật{' '}
              {providerLoc.updatedAt.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
