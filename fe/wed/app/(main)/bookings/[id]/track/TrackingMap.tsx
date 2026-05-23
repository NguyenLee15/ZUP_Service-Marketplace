'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ---- Custom icons ----
const providerIcon = L.divIcon({
  html: `<div style="
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #006BFF, #004EBA);
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 15px rgba(0,107,255,0.4), 0 2px 8px rgba(0,0,0,0.2);
    display: flex; align-items: center; justify-content: center;
  ">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
      <path d="M15 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 13.52 9H10"/>
      <circle cx="17" cy="18" r="2"/>
      <circle cx="7" cy="18" r="2"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const customerIcon = L.divIcon({
  html: `<div style="
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #10B981, #059669);
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 0 12px rgba(16,185,129,0.4), 0 2px 8px rgba(0,0,0,0.2);
    display: flex; align-items: center; justify-content: center;
  ">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// ---- Auto-pan map ----
function MapUpdater({
  providerLat,
  providerLng,
  customerLat,
  customerLng,
}: {
  providerLat: number;
  providerLng: number;
  customerLat: number;
  customerLng: number;
}) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      // Fit both markers on first render
      const bounds = L.latLngBounds(
        [providerLat, providerLng],
        [customerLat, customerLng],
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      hasInitialized.current = true;
    } else {
      // Smoothly follow provider
      map.panTo([providerLat, providerLng], { animate: true, duration: 1 });
    }
  }, [providerLat, providerLng, customerLat, customerLng, map]);

  return null;
}

// ---- Props ----
interface TrackingMapProps {
  providerLocation: {
    lat: number;
    lng: number;
    heading: number;
    speed: number;
  } | null;
  customerLocation: { lat: number; lng: number };
  trail: [number, number][];
}

export default function TrackingMap({
  providerLocation,
  customerLocation,
  trail,
}: TrackingMapProps) {
  const center: [number, number] = providerLocation
    ? [providerLocation.lat, providerLocation.lng]
    : [customerLocation.lat, customerLocation.lng];

  return (
    <MapContainer
      center={center}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      zoomControl={false}
    >
      {/* Modern tile layer — CartoDB Voyager */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {/* Route trail */}
      {trail.length > 1 && (
        <>
          {/* Shadow line */}
          <Polyline
            positions={trail}
            pathOptions={{
              color: '#006BFF',
              weight: 6,
              opacity: 0.15,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          {/* Main line */}
          <Polyline
            positions={trail}
            pathOptions={{
              color: '#006BFF',
              weight: 3,
              opacity: 0.7,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: '8, 12',
            }}
          />
        </>
      )}

      {/* Customer location */}
      <Marker
        position={[customerLocation.lat, customerLocation.lng]}
        icon={customerIcon}
      >
        <Popup>
          <div className="text-center p-1">
            <p className="font-bold text-sm">📍 Địa chỉ của bạn</p>
            <p className="text-xs text-gray-500 mt-1">Điểm đến của thợ</p>
          </div>
        </Popup>
      </Marker>

      {/* Customer accuracy ring */}
      <Circle
        center={[customerLocation.lat, customerLocation.lng]}
        radius={100}
        pathOptions={{
          color: '#10B981',
          fillColor: '#10B981',
          fillOpacity: 0.08,
          weight: 1,
          opacity: 0.3,
        }}
      />

      {/* Provider location */}
      {providerLocation && (
        <>
          <Marker
            position={[providerLocation.lat, providerLocation.lng]}
            icon={providerIcon}
          >
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-sm">🔧 Thợ đang di chuyển</p>
                <p className="text-xs text-gray-500 mt-1">
                  Tốc độ: {Math.round(providerLocation.speed)} km/h
                </p>
              </div>
            </Popup>
          </Marker>

          {/* Provider pulse ring */}
          <Circle
            center={[providerLocation.lat, providerLocation.lng]}
            radius={80}
            pathOptions={{
              color: '#006BFF',
              fillColor: '#006BFF',
              fillOpacity: 0.06,
              weight: 1,
              opacity: 0.2,
            }}
          />

          <MapUpdater
            providerLat={providerLocation.lat}
            providerLng={providerLocation.lng}
            customerLat={customerLocation.lat}
            customerLng={customerLocation.lng}
          />
        </>
      )}
    </MapContainer>
  );
}
