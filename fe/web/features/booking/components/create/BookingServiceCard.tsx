'use client';

import React from 'react';
import { Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/features/booking/hooks/useCreateBookingFlow';

interface BookingServiceCardProps {
  service: ApiPayload;
}

export function BookingServiceCard({ service }: BookingServiceCardProps) {
  if (!service) return null;

  return (
    <Card className="mb-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs py-0">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-2xl shrink-0 overflow-hidden shadow-xs">
          {service.images?.[0]?.imageUrl ? (
            <img
              src={service.images[0].imageUrl}
              alt={service.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Wrench className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{service.name}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{service.provider?.fullName}</p>
          <p className="text-sm font-semibold text-sky-600 dark:text-sky-400 mt-0.5">
            Giá tham khảo: {formatPrice(Number(service.referencePrice))}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
