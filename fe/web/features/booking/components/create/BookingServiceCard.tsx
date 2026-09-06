'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/features/booking/hooks/useCreateBookingFlow';

interface BookingServiceCardProps {
  service: ApiPayload;
}

export function BookingServiceCard({ service }: BookingServiceCardProps) {
  if (!service) return null;

  return (
    <Card className="glass-panel glow-hover mb-6 rounded-[20px] py-0 text-white">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0 overflow-hidden shadow-sm">
          {service.images?.[0]?.imageUrl ? (
            <img
              src={service.images[0].imageUrl}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            '🔧'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{service.name}</h3>
          <p className="text-sm text-muted-foreground">{service.provider?.fullName}</p>
          <p className="text-sm font-semibold text-action-blue mt-0.5">
            Giá tham khảo: {formatPrice(Number(service.referencePrice))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

