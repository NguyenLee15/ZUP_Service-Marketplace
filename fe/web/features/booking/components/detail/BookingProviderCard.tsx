'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, Phone, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BookingProviderCardProps {
  booking: ApiPayload;
}

export function BookingProviderCard({ booking }: BookingProviderCardProps) {
  const router = useRouter();

  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs py-0">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-action-blue to-glacier-blue flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden shadow-[0_0_15px_rgba(0,107,255,0.3)]">
          {booking.provider?.avatarUrl ? (
            <img
              src={booking.provider.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            booking.provider?.fullName?.charAt(0) || '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
            Người thực hiện dịch vụ
          </p>
          <h2 className="mt-1 text-base font-bold text-foreground truncate">
            {booking.provider?.fullName || 'Chưa có thông tin'}
          </h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              Nhà cung cấp phụ trách đơn hàng này
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              {booking.provider?.phone || 'Chưa cập nhật số điện thoại'}
            </span>
          </div>
          {booking.provider && (
            <button
              onClick={() => {
                if (booking.conversationId) {
                  router.push(`/chat?conversationId=${booking.conversationId}`);
                } else {
                  router.push(`/chat?bookingId=${booking.id}`);
                }
              }}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-action-blue/10 border border-action-blue/20 text-action-blue text-xs font-semibold hover:bg-action-blue/20 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Nhắn tin
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

