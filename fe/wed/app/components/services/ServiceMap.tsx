'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Service } from '@/types';
import { Star, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getSafeServiceImageSrc } from '@/lib/security/image-sources';

// Fix Leaflet icon issue
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface ServiceMapProps {
  services: Service[];
  userLocation: { lat: number, lng: number } | null;
}

// Helper to center map
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

export function ServiceMap({ services, userLocation }: ServiceMapProps) {
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [21.0285, 105.8542]; // Hà Nội default

  return (
    <div className="w-full h-[calc(100vh-250px)] rounded-[20px] overflow-hidden border border-platinum-tint bg-white shadow-[var(--brand-shadow-card)] relative animate-in fade-in duration-700">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]}>
            <Popup>Vị trí của bạn</Popup>
          </Marker>
        )}

        {services.map((service) => {
          // Mocking coordinates for demo if not present
          const lat = Number(service.latitude) || (center[0] + (Math.random() - 0.5) * 0.05);
          const lng = Number(service.longitude) || (center[1] + (Math.random() - 0.5) * 0.05);

          return (
            <Marker key={service.id} position={[lat, lng]}>
              <Popup className="service-popup">
                <div className="w-64 p-1">
                  <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                    {service.images?.[0]?.imageUrl ? (
                      <Image src={getSafeServiceImageSrc(service.images[0].imageUrl, service)} alt={service.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">🔧</div>
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold flex items-center gap-1 text-midnight-indigo shadow-sm">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {Number(service.avgRating || 0).toFixed(1)}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-midnight-indigo line-clamp-1">{service.name}</h4>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-action-blue">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(service.referencePrice))}
                      </p>
                      <Link href={`/services/${service.id}`} className="text-[10px] font-bold text-action-blue hover:text-glacier-blue hover:underline flex items-center gap-0.5 uppercase">
                        Chi tiết <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    </div>
                    
                    <div className="pt-2 border-t border-border flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-action-blue flex items-center justify-center text-[8px] font-bold text-white uppercase">
                        {service.provider?.fullName?.charAt(0)}
                      </div>
                      <span className="text-[10px] font-medium text-muted-foreground truncate">{service.provider?.fullName}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <ChangeView center={center} />
      </MapContainer>

      {/* Map Overlay Info */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-[20px] border border-platinum-tint shadow-[var(--brand-shadow-card)] max-w-xs pointer-events-none">
        <p className="text-[10px] font-bold text-action-blue uppercase tracking-widest mb-1">Bản đồ dịch vụ</p>
        <p className="text-xs text-slate-blue font-medium">Tìm thấy {services.length} thợ đang ở gần vị trí của bạn.</p>
      </div>
    </div>
  );
}
