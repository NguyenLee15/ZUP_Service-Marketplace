'use client';

import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const providers = [
  { id: 1, lat: 21.0285, lng: 105.8542, count: 45, area: 'Hoàn Kiếm' },
  { id: 2, lat: 21.0362, lng: 105.7905, count: 82, area: 'Cầu Giấy' },
  { id: 3, lat: 21.0065, lng: 105.8433, count: 30, area: 'Hai Bà Trưng' },
  { id: 4, lat: 20.9948, lng: 105.7996, count: 65, area: 'Thanh Xuân' },
  { id: 5, lat: 21.0481, lng: 105.8159, count: 20, area: 'Ba Đình' },
];

function getDensityColor(count: number) {
  if (count > 70) return '#ef4444';
  if (count > 40) return '#f59e0b';
  return '#10b981';
}

export function ProviderHeatmap() {
  const center: [number, number] = [21.0285, 105.8542];

  return (
    <div className="relative h-[360px] overflow-hidden rounded-b-xl bg-cloud-mist dark:bg-gray-900">
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {providers.map((provider) => (
          <Circle
            key={provider.id}
            center={[provider.lat, provider.lng]}
            radius={800 + provider.count * 10}
            pathOptions={{
              fillColor: getDensityColor(provider.count),
              fillOpacity: 0.42,
              color: getDensityColor(provider.count),
              weight: 1,
            }}
          >
            <Popup>
              <div className="min-w-[132px] p-2">
                <p className="mb-1 text-sm font-semibold">{provider.area}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Nhà cung cấp</span>
                  <span className="font-semibold text-action-blue">{provider.count}</span>
                </div>
              </div>
            </Popup>
          </Circle>
        ))}
      </MapContainer>

      <div className="absolute bottom-4 right-4 z-[1000] space-y-2 rounded-xl border border-platinum-tint bg-white/95 p-3 text-xs shadow-[var(--brand-shadow-sm)] backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="font-semibold text-slate-blue">Chú thích</div>
        <LegendItem color="bg-red-500" label="Cao trên 70" />
        <LegendItem color="bg-amber-500" label="Trung bình" />
        <LegendItem color="bg-emerald-500" label="Thấp" />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-blue dark:text-gray-300">
      <span className={`size-3 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}
