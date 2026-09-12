'use client';

import React from 'react';
import { Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BookingStepper } from '@/app/components/bookings/BookingStepper';
import { BookingStatus } from '@/types';

export function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, string> = {
    PENDING: 'bg-yellow-100/80 text-yellow-700 shadow-[0_0_8px_rgba(234,179,8,0.15)]',
    QUOTED: 'bg-action-blue/10 text-action-blue shadow-[0_0_8px_rgba(0,107,255,0.15)]',
    CONFIRMED: 'bg-glacier-blue/10 text-glacier-blue shadow-[0_0_8px_rgba(0,78,186,0.15)]',
    IN_PROGRESS: 'bg-cyan-100/80 text-cyan-700 shadow-[0_0_8px_rgba(6,182,212,0.2)]',
    DONE: 'bg-green-100/80 text-green-700 shadow-[0_0_8px_rgba(22,163,74,0.15)]',
    DISPUTED: 'bg-red-100/80 text-red-700 shadow-[0_0_8px_rgba(220,38,38,0.15)]',
    CANCELLED: 'bg-pale-gray text-slate-blue',
  };
  const labels: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    QUOTED: 'Đã báo giá',
    CONFIRMED: 'Đã xác nhận',
    IN_PROGRESS: 'Đang thực hiện',
    DONE: 'Hoàn thành',
    DISPUTED: 'Khiếu nại',
    CANCELLED: 'Đã hủy',
  };
  return (
    <Badge
      className={`${configs[status] || configs.PENDING} border-0 text-xs font-bold px-3 py-1`}
    >
      {labels[status] || status}
    </Badge>
  );
}

interface BookingHeaderStepperProps {
  booking: ApiPayload;
  timeLeft: string;
}

export function BookingHeaderStepper({ booking, timeLeft }: BookingHeaderStepperProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md glass-panel text-[10px] font-bold text-action-blue uppercase tracking-wider">
              Mã đơn
            </span>
            <span className="text-sm text-foreground/60 font-mono">
              #{booking.bookingCode}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {booking.service?.name}
          </h1>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      {/* Stepper Timeline */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs p-3 sm:p-4 overflow-hidden">
        <BookingStepper currentStatus={booking.status} />
      </div>

      {/* Auto-completion Countdown */}
      {booking.status === BookingStatus.DONE &&
        !booking.autoCompletedAt &&
        timeLeft && (
          <div className="rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/70 dark:bg-sky-950/40 p-4 flex items-center gap-3 border-l-4 border-l-sky-600">
            <div className="w-10 h-10 rounded-full bg-action-blue/10 flex items-center justify-center">
              <Timer className="w-5 h-5 text-action-blue" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Tự động nghiệm thu sau
              </p>
              <p className="text-lg font-bold text-action-blue font-mono tracking-wider">
                {timeLeft}
              </p>
            </div>
          </div>
        )}
    </div>
  );
}

