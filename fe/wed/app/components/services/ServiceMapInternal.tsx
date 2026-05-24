'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Service } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { getSafeImageSrc } from '@/lib/security/image-sources';

// Fix Leaflet marker icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface ServiceMapInternalProps {
  services: Service[];
}

export default function ServiceMapInternal({ services }: ServiceMapInternalProps) {
  // Default to center of Vietnam or first service
  const center: [number, number] = services.length > 0 && services[0].latitude && services[0].longitude
    ? [Number(services[0].latitude), Number(services[0].longitude)]
    : [10.762622, 106.660172]; // HCM City

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="h-[calc(100vh-250px)] w-full rounded-[20px] overflow-hidden border border-platinum-tint bg-white shadow-[var(--brand-shadow-card)] z-0">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {services.map((service) => (
          service.latitude && service.longitude && (
            <Marker key={service.id} position={[Number(service.latitude), Number(service.longitude)]}>
              <Popup className="custom-popup">
                <div className="w-48 p-1">
                  <div className="relative h-24 rounded-lg overflow-hidden mb-2">
                    {service.images?.[0]?.imageUrl ? (
                      <Image src={getSafeImageSrc(service.images[0].imageUrl)} alt={service.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">🔧</div>
                    )}
                  </div>
                  <h4 className="font-bold text-xs text-midnight-indigo line-clamp-1 mb-1">{service.name}</h4>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-action-blue">{formatPrice(Number(service.referencePrice))}</span>
                    <div className="flex items-center gap-0.5 text-[10px] font-bold text-yellow-600">
                      <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />
                      {Number(service.avgRating || 0).toFixed(1)}
                    </div>
                  </div>
                  <Link
                    href={`/services/${service.id}`}
                    className="block w-full py-1.5 bg-action-blue text-white text-center text-[10px] font-bold rounded-md hover:bg-glacier-blue transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
