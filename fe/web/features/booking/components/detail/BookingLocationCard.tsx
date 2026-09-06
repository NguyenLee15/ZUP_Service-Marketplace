'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, MapPin, User } from 'lucide-react';

interface BookingLocationCardProps {
  booking: ApiPayload;
  formatDate: (d: string) => string;
}

export function BookingLocationCard({
  booking,
  formatDate,
}: BookingLocationCardProps) {
  const fullAddress = [
    booking.addressDetail,
    booking.ward,
    booking.district,
    booking.province,
  ]
    .filter(Boolean)
    .filter((p) => p !== 'Không áp dụng')
    .join(', ');

  return (
    <Card className="glass-panel glow-hover rounded-2xl border-0">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-action-blue shrink-0" />
          <span>{fullAddress || 'Chưa cập nhật địa chỉ'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4 text-action-blue shrink-0" />
          <span>Mong muốn: {formatDate(booking.desiredTime)}</span>
        </div>
        {booking.surveyorName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4 text-action-blue shrink-0" />
            <span>
              Người khảo sát: {booking.surveyorName} ({booking.surveyorPhone})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

